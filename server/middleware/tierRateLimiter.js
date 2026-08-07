import logger from "../utils/logger.js";
import { _getRedisClient } from "../services/rateLimitService.js";

// In-memory fallback stores
const memoryBuckets = new Map(); // key -> { tokens, lastUpdated }
const memoryViolations = new Map(); // key -> { count, expiresAt }
const memoryBlocked = new Map(); // key -> expiresAt

// Rate limiting configurations
const CONFIG = {
  guest: {
    capacity: 20,
    refillRate: 0.5, // tokens per second (30/min)
    baseCooldown: 10, // seconds
  },
  authenticated: {
    capacity: 100,
    refillRate: 2.0, // tokens per second (120/min)
    baseCooldown: 5, // seconds
  },
};

/**
 * Clean up expired memory entries to prevent memory leaks
 */
function pruneMemoryStores() {
  const now = Date.now();
  for (const [key, val] of memoryViolations.entries()) {
    if (now > val.expiresAt) memoryViolations.delete(key);
  }
  for (const [key, expiresAt] of memoryBlocked.entries()) {
    if (now > expiresAt) memoryBlocked.delete(key);
  }
}

// Periodically prune in-memory stores every 5 minutes
setInterval(pruneMemoryStores, 5 * 60 * 1000).unref();

/**
 * Custom tier-based rate limiter middleware
 *
 * @param {Object} options Configuration overrides
 * @returns {Function} Express middleware function
 */
export function tierRateLimiter(options = {}) {
  return async function (req, res, next) {
    const redis = _getRedisClient();

    // 1. Identify Client & Tier
    let identifier = "";
    let tier = "guest";

    if (req.adminSession && req.adminSession.username) {
      identifier = `admin:${req.adminSession.username}`;
      tier = "authenticated";
    } else if (req.user && req.user.id) {
      identifier = `user:${req.user.id}`;
      tier = "authenticated";
    } else {
      identifier = `ip:${req.ip}`;
      tier = "guest";
    }

    const { capacity, refillRate, baseCooldown } = {
      ...CONFIG[tier],
      ...options,
    };
    const rateLimitKey = `tier-rate-limit:${identifier}`;
    const violationsKey = `tier-rate-limit-violations:${identifier}`;
    const blockedKey = `tier-rate-limit-blocked:${identifier}`;

    // 2. Redis Implementation
    if (redis && redis.status === "ready") {
      try {
        // A. Check if currently blocked
        const blockedTtl = await redis.ttl(blockedKey);
        if (blockedTtl > 0) {
          res.setHeader("Retry-After", blockedTtl);
          return res.status(429).json({
            error: "Too many requests. Temporary cooldown active.",
            retryAfter: blockedTtl,
          });
        }

        // B. Atomic Token Bucket Execution via Lua Script
        const luaScript = `
          local key = KEYS[1]
          local capacity = tonumber(ARGV[1])
          local refill_rate = tonumber(ARGV[2])
          local now = tonumber(ARGV[3])
          
          local data = redis.call('HMGET', key, 'tokens', 'last_updated')
          local tokens = tonumber(data[1])
          local last_updated = tonumber(data[2])
          
          if not tokens then
            tokens = capacity
            last_updated = now
          else
            local elapsed = (now - last_updated) / 1000.0
            if elapsed > 0 then
              tokens = math.min(capacity, tokens + (elapsed * refill_rate))
              last_updated = now
            end
          end
          
          if tokens >= 1 then
            tokens = tokens - 1
            redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
            redis.call('EXPIRE', key, 3600)
            return {1, math.floor(tokens)}
          else
            redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
            return {0, 0}
          end
        `;

        const [allowed, tokensLeft] = await redis.eval(
          luaScript,
          1,
          rateLimitKey,
          capacity.toString(),
          refillRate.toString(),
          Date.now().toString()
        );

        if (allowed === 1) {
          res.setHeader("X-RateLimit-Limit", capacity);
          res.setHeader("X-RateLimit-Remaining", tokensLeft);
          return next();
        }

        // C. Rate limit exceeded: Increment violations & set exponential block
        const violations = await redis.incr(violationsKey);
        await redis.expire(violationsKey, 3600); // Violations reset after 1 hour of silence

        // Exponential backoff: baseCooldown * (2 ^ (violations - 1))
        const cooldownSec = Math.min(
          baseCooldown * Math.pow(2, violations - 1),
          3600
        );
        await redis.set(blockedKey, "1", "EX", cooldownSec);

        logger.warn(
          `[TierRateLimiter] Rate limit violated by ${identifier}. Active block: ${cooldownSec}s. Tier: ${tier}.`
        );

        res.setHeader("Retry-After", cooldownSec);
        return res.status(429).json({
          error: "Rate limit exceeded. Temporary cooldown active.",
          retryAfter: cooldownSec,
        });
      } catch (err) {
        logger.error(
          "[TierRateLimiter] Redis error, falling back to memory:",
          err.message
        );
      }
    }

    // 3. In-Memory Fallback Implementation
    const now = Date.now();

    // A. Check if currently blocked
    const blockExpiresAt = memoryBlocked.get(blockedKey);
    if (blockExpiresAt && now < blockExpiresAt) {
      const remainingSec = Math.ceil((blockExpiresAt - now) / 1000);
      res.setHeader("Retry-After", remainingSec);
      return res.status(429).json({
        error: "Too many requests. Temporary cooldown active.",
        retryAfter: remainingSec,
      });
    }

    // B. Token Bucket calculation
    let bucket = memoryBuckets.get(rateLimitKey);
    if (!bucket) {
      bucket = { tokens: capacity, lastUpdated: now };
    } else {
      const elapsed = (now - bucket.lastUpdated) / 1000.0;
      if (elapsed > 0) {
        bucket.tokens = Math.min(
          capacity,
          bucket.tokens + elapsed * refillRate
        );
        bucket.lastUpdated = now;
      }
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      memoryBuckets.set(rateLimitKey, bucket);

      res.setHeader("X-RateLimit-Limit", capacity);
      res.setHeader("X-RateLimit-Remaining", Math.floor(bucket.tokens));
      return next();
    }

    // C. Limit Exceeded: Increment violations & block client
    let violationObj = memoryViolations.get(violationsKey);
    if (!violationObj || now > violationObj.expiresAt) {
      violationObj = { count: 1, expiresAt: now + 3600 * 1000 };
    } else {
      violationObj.count += 1;
      violationObj.expiresAt = now + 3600 * 1000;
    }
    memoryViolations.set(violationsKey, violationObj);

    // Exponential backoff
    const cooldownSec = Math.min(
      baseCooldown * Math.pow(2, violationObj.count - 1),
      3600
    );
    memoryBlocked.set(blockedKey, now + cooldownSec * 1000);

    logger.warn(
      `[TierRateLimiter] Rate limit violated by ${identifier} (memory). Active block: ${cooldownSec}s. Tier: ${tier}.`
    );

    res.setHeader("Retry-After", cooldownSec);
    return res.status(429).json({
      error: "Rate limit exceeded. Temporary cooldown active.",
      retryAfter: cooldownSec,
    });
  };
}
