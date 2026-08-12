/**
 * throttleMiddleware.js
 *
 * Gradual slowdown before hard rate-limit block:
 *   – At 80 % of limit → 100 ms delay
 *   – At 90 % of limit → 500 ms delay
 *   – At 100 %         → 429 Too Many Requests
 *
 * Also handles:
 *   – Whitelist / blacklist (Redis sets: ratelimit:whitelist, ratelimit:blacklist)
 *   – Abuse detection (same IP bursting > ABUSE_THRESHOLD in ABUSE_WINDOW_SEC)
 *   – Auto-block abusive IPs for AUTOBLOCK_TTL_SEC
 */

import { getRedisClient } from '../utils/redis.js';
import logger from '../utils/logger.js';

// ── config ──────────────────────────────────────────────────────────────────
const ABUSE_THRESHOLD = 300; // requests within the window that trigger auto-block
const ABUSE_WINDOW_SEC = 60;
const AUTOBLOCK_TTL_SEC = 3600; // 1 hour auto-block
const DELAY_80_MS = 100;
const DELAY_90_MS = 500;

// ── redis client (shared singleton) ─────────────────────────────────────────
async function getRedis() {
  return getRedisClient();
}

// ── in-memory fallback stores ────────────────────────────────────────────────
const memWhitelist = new Set((process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(Boolean));
const memBlacklist = new Set((process.env.RATE_LIMIT_BLACKLIST || '').split(',').filter(Boolean));
const memAbuse = new Map(); // ip → { count, resetAt }
const memAutoblock = new Map(); // ip → unblocksAt (ms)
import { createClient } from 'redis';

// ── config ──────────────────────────────────────────────────────────────────

// ── redis client helper ─────────────────────────────────────────────────────

// ── in-memory fallback stores ────────────────────────────────────────────────

// ── helpers ──────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    'unknown'
  );
}

// ── whitelist / blacklist checks ─────────────────────────────────────────────
async function isWhitelisted(ip, redis) {
  if (memWhitelist.has(ip)) return true;
  if (!redis) return false;
  return !!(await redis.sismember('ratelimit:whitelist', ip));
  return !!(await redis.sIsMember('ratelimit:whitelist', ip));
}

async function isBlacklisted(ip, redis) {
  if (memBlacklist.has(ip)) return true;
  if (!redis) return false;
  return !!(await redis.sismember('ratelimit:blacklist', ip));
  return !!(await redis.sIsMember('ratelimit:blacklist', ip));
}

async function isAutoblocked(ip, redis) {
  if (redis) {
    return !!(await redis.exists(`ratelimit:autoblock:${ip}`));
  }
  const entry = memAutoblock.get(ip);
  if (!entry) return false;
  if (Date.now() > entry) {
    memAutoblock.delete(ip);
    return false;
  }
  if (Date.now() > entry) { memAutoblock.delete(ip); return false; }
  return true;
}

async function recordAndCheckAbuse(ip, redis) {
  if (redis) {
    const key = `ratelimit:abuse:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ABUSE_WINDOW_SEC);
    if (count > ABUSE_THRESHOLD) {
      await redis.set(`ratelimit:autoblock:${ip}`, '1', 'EX', AUTOBLOCK_TTL_SEC);
      await redis.set(`ratelimit:autoblock:${ip}`, '1', { EX: AUTOBLOCK_TTL_SEC });
      logger.warn('ThrottleMiddleware: auto-blocked abusive IP', { ip, count });
      return true;
    }
    return false;
  }

  // in-memory fallback
  const now = Date.now();
  let entry = memAbuse.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + ABUSE_WINDOW_SEC * 1000 };
  }
  entry.count++;
  memAbuse.set(ip, entry);
  if (entry.count > ABUSE_THRESHOLD) {
    memAutoblock.set(ip, now + AUTOBLOCK_TTL_SEC * 1000);
    logger.warn('ThrottleMiddleware: auto-blocked abusive IP (in-memory)', { ip });
    return true;
  }
  return false;
}

// ── core throttle logic ───────────────────────────────────────────────────────
/**
 * Reads X-RateLimit-Limit and X-RateLimit-Remaining headers that have already
 * been set by the upstream rate-limiter (e.g. tierRateLimiter) and applies
 * gradual delays at 80 % / 90 % usage.
 */
export async function throttleMiddleware(req, res, next) {
  const ip = clientIp(req);
  const redis = await getRedis();

    // 1. whitelist — skip all limits
    if (await isWhitelisted(ip, redis)) return next();

    // 2. blacklist — hard block
    if (await isBlacklisted(ip, redis)) {
      return res.status(403).json({
        error: 'Forbidden',
        error:   'Forbidden',
        message: 'Your IP has been blocked. Contact support if you believe this is in error.',
      });
    }

    // 3. auto-block check
    if (await isAutoblocked(ip, redis)) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Automated abuse detected. Your IP is temporarily blocked.',
        error:       'Too Many Requests',
        message:     'Automated abuse detected. Your IP is temporarily blocked.',
        'retry-after': AUTOBLOCK_TTL_SEC,
      });
    }

    // 4. abuse counter (runs on every request — abuse is checked above first)
    const justBlocked = await recordAndCheckAbuse(ip, redis);
    if (justBlocked) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Abuse threshold exceeded. Your IP has been temporarily blocked for 1 hour.',
        error:       'Too Many Requests',
        message:     'Abuse threshold exceeded. Your IP has been temporarily blocked for 1 hour.',
        'retry-after': AUTOBLOCK_TTL_SEC,
      });
    }

    // 5. throttle based on rate-limit headers set by upstream limiter
    const limit = parseInt(res.getHeader('X-RateLimit-Limit') || '0', 10);
    const remaining = parseInt(res.getHeader('X-RateLimit-Remaining') || limit.toString(), 10);

    if (limit > 0) {
      const used = limit - remaining;
    const limit     = parseInt(res.getHeader('X-RateLimit-Limit')     || '0', 10);
    const remaining = parseInt(res.getHeader('X-RateLimit-Remaining') || limit.toString(), 10);

    if (limit > 0) {
      const used = limit - remaining;
      const pctUsed = used / limit;

      if (pctUsed >= 0.9) {
        await delay(DELAY_90_MS);
      } else if (pctUsed >= 0.8) {
        await delay(DELAY_80_MS);
      }
    }

    next();
    next(); // fail open — never block legitimate traffic due to middleware errors
  }
}

// ── admin helpers (used by admin API routes) ──────────────────────────────────
export async function addToWhitelist(ip) {
  memWhitelist.add(ip);
  const redis = await getRedis();
  if (redis) await redis.sadd('ratelimit:whitelist', ip);
  if (redis) await redis.sAdd('ratelimit:whitelist', ip);
}

export async function removeFromWhitelist(ip) {
  memWhitelist.delete(ip);
  const redis = await getRedis();
  if (redis) await redis.srem('ratelimit:whitelist', ip);
  if (redis) await redis.sRem('ratelimit:whitelist', ip);
}

export async function addToBlacklist(ip) {
  memBlacklist.add(ip);
  const redis = await getRedis();
  if (redis) await redis.sadd('ratelimit:blacklist', ip);
  if (redis) await redis.sAdd('ratelimit:blacklist', ip);
}

export async function removeFromBlacklist(ip) {
  memBlacklist.delete(ip);
  const redis = await getRedis();
  if (redis) await redis.srem('ratelimit:blacklist', ip);
  if (redis) await redis.sRem('ratelimit:blacklist', ip);
}

export async function unblockIp(ip) {
  memAutoblock.delete(ip);
  const redis = await getRedis();
  if (redis) await redis.del(`ratelimit:autoblock:${ip}`);
}

export async function getWhitelist() {
  const redis = await getRedis();
  if (redis) return redis.smembers('ratelimit:whitelist');
  if (redis) return redis.sMembers('ratelimit:whitelist');
  return [...memWhitelist];
}

export async function getBlacklist() {
  const redis = await getRedis();
  if (redis) return redis.smembers('ratelimit:blacklist');
  if (redis) return redis.sMembers('ratelimit:blacklist');
  return [...memBlacklist];
}
