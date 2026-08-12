import logger from '../utils/logger.js';
import { _getRedisClient } from '../services/rateLimitService.js';

// In-memory fallback stores
const memoryBuckets = new Map(); // key -> { tokens, lastUpdated }
const memoryViolations = new Map(); // key -> { count, expiresAt }
const memoryBlocked = new Map(); // key -> expiresAt
const MEMORY_BUCKET_TTL_MS = 60 * 60 * 1000;

// Base rate limiting configurations per tier

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

// Per-endpoint rate limit overrides (#1618)
// More specific paths take precedence over less specific ones.
// Auth endpoints are stricter; data endpoints are more lenient.
const ENDPOINT_LIMITS = {
  '/api/auth': {
    guest: { capacity: 10, refillRate: 0.17, baseCooldown: 30 },
    authenticated: { capacity: 30, refillRate: 0.5, baseCooldown: 15 },
  },
  '/api/portfolio': {
    guest: { capacity: 15, refillRate: 0.5, baseCooldown: 20 },
    authenticated: { capacity: 60, refillRate: 2.0, baseCooldown: 10 },
  },
  '/api/sync': {
    guest: { capacity: 5, refillRate: 0.17, baseCooldown: 60 },
    authenticated: { capacity: 20, refillRate: 1.0, baseCooldown: 20 },
  },
  '/api/activity': {
    guest: { capacity: 10, refillRate: 0.33, baseCooldown: 30 },
    authenticated: { capacity: 40, refillRate: 1.5, baseCooldown: 10 },
  },
};

const ENDPOINT_PREFIXES = Object.keys(ENDPOINT_LIMITS).sort((a, b) => b.length - a.length);

function resolveEndpointConfig(path, tier) {
  if (!path) return {};
  const matched = ENDPOINT_PREFIXES.find((prefix) => path.startsWith(prefix));
  return matched ? ENDPOINT_LIMITS[matched][tier] : {};
}

export function resolveRateLimitConfig(path, tier) {
  const actualTier = CONFIG[tier] ? tier : 'guest';
  const endpointCfg = resolveEndpointConfig(path, actualTier);
  return { ...CONFIG[actualTier], ...endpointCfg };
}

/**
 * Clean up expired memory entries to prevent memory leaks
 */

export function pruneMemoryStores(now = Date.now()) {
  for (const [key, val] of memoryViolations.entries()) {
    if (now > val.expiresAt) memoryViolations.delete(key);
  }
  for (const [key, expiresAt] of memoryBlocked.entries()) {
    if (now > expiresAt) memoryBlocked.delete(key);
  }
  for (const [key, bucket] of memoryBuckets.entries()) {
    if (now - bucket.lastUpdated > MEMORY_BUCKET_TTL_MS) memoryBuckets.delete(key);
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
    let identifier = '';
    let tier = 'guest';

    if (req.adminSession && req.adminSession.username) {
      identifier = `admin:${req.adminSession.username}`;
      tier = 'authenticated';
    } else if (req.user && req.user.id) {
      identifier = `user:${req.user.id}`;
      tier = 'authenticated';
    } else {
      identifier = `ip:${req.ip}`;
      tier = 'guest';
    }

    const endpointCfg = resolveEndpointConfig(req.path, tier);
    const { capacity, refillRate, baseCooldown } = { ...CONFIG[tier], ...options, ...endpointCfg };
    const rateLimitKey = `tier-rate-limit:${identifier}`;
    const violationsKey = `tier-rate-limit-violations:${identifier}`;
    const blockedKey = `tier-rate-limit-blocked:${identifier}`;

    // 2. Redis Implementation
    if (redis && redis.status === 'ready') {
      try {
        // A. Check if currently blocked
        const blockedTtl = await redis.ttl(blockedKey);
        if (blockedTtl > 0) {
          res.setHeader('Retry-After', blockedTtl);
          res.setHeader('X-RateLimit-Limit', capacity);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + blockedTtl);
          return res.status(429).json({
            error: 'Too many requests. Temporary cooldown active.',
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
            redis.call('HMSET', key, 'last_updated', last_updated)
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
          const resetIn = Math.ceil((capacity - tokensLeft) / refillRate);
          res.setHeader('X-RateLimit-Limit', capacity);
          res.setHeader('X-RateLimit-Remaining', tokensLeft);
          res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + resetIn);
          return next();
        }

        // C. Rate limit exceeded: Increment violations & set exponential block
        const violations = await redis.incr(violationsKey);
        await redis.expire(violationsKey, 3600); // Violations reset after 1 hour of silence

        // Exponential backoff: baseCooldown * (2 ^ (violations - 1))
        const cooldownSec = Math.min(baseCooldown * Math.pow(2, violations - 1), 3600);
        await redis.set(blockedKey, '1', 'EX', cooldownSec);

        logger.warn(
          `[TierRateLimiter] Rate limit violated by ${identifier}. Active block: ${cooldownSec}s. Tier: ${tier}.`
        );

        res.setHeader('Retry-After', cooldownSec);
        res.setHeader('X-RateLimit-Limit', capacity);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + cooldownSec);
        return res.status(429).json({
          error: 'Rate limit exceeded. Temporary cooldown active.',
          retryAfter: cooldownSec,
        });
      } catch (err) {
        logger.error('[TierRateLimiter] Redis error, falling back to memory:', err.message);
      }
    }

    // 3. In-Memory Fallback Implementation
    const now = Date.now();

    // A. Check if currently blocked
    const blockExpiresAt = memoryBlocked.get(blockedKey);
    if (blockExpiresAt && now < blockExpiresAt) {
      const remainingSec = Math.ceil((blockExpiresAt - now) / 1000);
      res.setHeader('Retry-After', remainingSec);
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + remainingSec);
      return res.status(429).json({
        error: 'Too many requests. Temporary cooldown active.',
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
        bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRate);
        bucket.lastUpdated = now;
      }
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      memoryBuckets.set(rateLimitKey, bucket);

      const remainingMem = Math.floor(bucket.tokens);
      const resetMem = Math.ceil((capacity - remainingMem) / refillRate);
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', remainingMem);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + resetMem);
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
    const cooldownSec = Math.min(baseCooldown * Math.pow(2, violationObj.count - 1), 3600);
    memoryBlocked.set(blockedKey, now + cooldownSec * 1000);

    logger.warn(
      `[TierRateLimiter] Rate limit violated by ${identifier} (memory). Active block: ${cooldownSec}s. Tier: ${tier}.`
    );

    res.setHeader('Retry-After', cooldownSec);
    res.setHeader('X-RateLimit-Limit', capacity);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + cooldownSec);
    return res.status(429).json({
      error: 'Rate limit exceeded. Temporary cooldown active.',
      retryAfter: cooldownSec,
    });
  };
}
