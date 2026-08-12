import { Redis } from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { MemoryStore } from 'express-rate-limit';
import logger from '../utils/logger.js';

let redisClient = null;

/**
 * A bounded in-memory rate-limit store that evicts the oldest
 * entries when capacity is reached, instead of purging all keys.
 */
class CappedMemoryStore {
  constructor(maxKeys = 10000) {
    this.store = new MemoryStore();
    this.maxKeys = maxKeys;
    this.options = null;
    this.keyOrder = [];
  }

  init(options) {
    this.options = options;
    return this.store.init(options);
  }

  async increment(key) {
    if (this.store.localKeys?.length >= this.maxKeys) {
      this.evictLRU();
    }
    return this.store.increment(key);
  }

  async decrement(key) {
    return this.store.decrement(key);
  }

  async resetKey(key) {
    this.keyOrder = this.keyOrder.filter((k) => k !== key);
    return this.store.resetKey(key);
  }

  async get(key) {
    return this.store.get ? this.store.get(key) : undefined;
  }

  evictLRU() {
    const keys = this.store.localKeys || [];
    const evictCount = Math.max(1, Math.floor(this.maxKeys * 0.1));
    const toEvict = keys.slice(0, evictCount);

    for (const key of toEvict) {
      this.store.resetKey(key);
      this.keyOrder = this.keyOrder.filter((k) => k !== key);
    }

    logger.warn('[RateLimiter] CappedMemoryStore LRU eviction', {
      evicted: toEvict.length,
      remaining: (this.store.localKeys?.length || 0) - toEvict.length,
    });
  }
}

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

if (process.env.UPSTASH_REDIS_REST_URL && !process.env.REDIS_URL) {
  throw new Error(
    'Configuration Error: ioredis does not support Upstash REST URLs. Please use a TCP connection string under REDIS_URL instead.'
  );
}
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn(
            '[RateLimiter] Redis unreachable after 3 retries, falling back to memory store if necessary.'
          );
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('error', (err) => {
      logger.warn('[RateLimiter] Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('[RateLimiter] Successfully connected to Redis rate limit store.');
    });
  } catch (err) {
    logger.warn('[RateLimiter] Failed to initialize Redis client:', err.message);
    redisClient = null;
  }
}

export function createRateLimitStore(prefix) {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: prefix,
    });
  }
  return new CappedMemoryStore(10000);
}

export function _getRedisClient() {
  return redisClient;
}

export function _closeRedis() {
  if (redisClient) {
    redisClient.quit();
  }
}

export const temporaryBlockUser = () => {};
export const getBlockedIPs = () => {};
