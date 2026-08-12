import Redis from 'ioredis';
import logger from './logger.js';
import { recordCacheHit, recordCacheMiss } from '../observability/metrics.js';

let redisClient = null;
const inFlightQueries = new Map();
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL_MS = 30000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;

function isRedisHealthy() {
  if (!redisClient) return false;
  if (redisClient.status !== 'ready') return false;
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL_MS) return true;
  lastHealthCheck = now;
  return true;
}

async function performHealthCheck() {
  if (!redisClient) return false;
  try {
    const result = await redisClient.ping();
    if (result === 'PONG') {
      lastHealthCheck = Date.now();
      return true;
    }
    logger.warn('Redis health check failed: unexpected ping response');
    return false;
  } catch (err) {
    logger.error('Redis health check failed:', err.message);
    return false;
  }
}

export function getRedisClient() {
  if (!redisClient) {
    if (!process.env.REDIS_URL) {
      return null;
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      retryStrategy(times) {
        if (times > 10) {
          logger.error('Redis max retry attempts reached, giving up');
          return null;
        }
        return Math.min(times * 200, 3000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      lastHealthCheck = Date.now();
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
    });
  }
  return redisClient;
}

export async function getCachedQuery(key, queryFn, ttlSeconds = 300) {
  const client = getRedisClient();

  if (!client) {
    return queryFn();
  }

  if (!isRedisHealthy()) {
    const healthy = await performHealthCheck();
    if (!healthy) {
      logger.warn('Redis unhealthy, falling back to query function');
      return queryFn();
    }
  }

  // Try to read from cache first
  let cached = null;
  try {
    cached = await client.get(key);
    if (cached) {
      recordCacheHit();
      return JSON.parse(cached);
    }
    recordCacheMiss();
  } catch (err) {
    logger.warn('Redis cache read error, falling back to database query:', err);
  }

  const existingQuery = inFlightQueries.get(key);
  if (existingQuery) {
    return existingQuery;
  }

  const queryPromise = (async () => {
    const result = await queryFn();

    // Best-effort cache write
    try {
      client.set(key, JSON.stringify(result), 'EX', ttlSeconds).catch((err) => {
        logger.error('Error setting Redis cache:', err);
      });
    } catch (err) {
      logger.warn('Redis cache write error:', err);
    }

    return result;
  })();

  inFlightQueries.set(key, queryPromise);

  try {
    return await queryPromise;
  } finally {
    if (inFlightQueries.get(key) === queryPromise) {
      inFlightQueries.delete(key);
    }
  }
  // Cache miss or Redis error — run queryFn exactly once
  const result = await queryFn();

  try {
    client.set(key, JSON.stringify(result), 'EX', ttlSeconds).catch((err) => {
      logger.error('Error setting Redis cache:', err);
    });
  } catch (err) {
    logger.warn('Redis cache write error:', err);
  }

  return result;
}

export function clearCache(keyPattern) {
  const client = getRedisClient();

  if (!client) {
    return Promise.resolve(0);
  }

  return new Promise((resolve, reject) => {
    const stream = client.scanStream({
      match: keyPattern,
      count: 100,
    });

    let deletedCount = 0;
    const deletePromises = [];

    stream.on('data', (resultKeys) => {
      if (resultKeys.length > 0) {
        const promise = client
          .del(...resultKeys)
          .then((count) => {
            deletedCount += count;
          })
          .catch((err) => {
            logger.error('Error deleting cache keys batch:', err);
          });
        deletePromises.push(promise);
      }
    });

    stream.on('end', async () => {
      try {
        await Promise.all(deletePromises);
        resolve(deletedCount);
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

const redisMock = {
  get: async (key) => {
    const client = getRedisClient();
    return client ? client.get(key) : null;
  },
  set: async (key, val, mode, ttl) => {
    const client = getRedisClient();
    return client ? client.set(key, val, mode, ttl) : null;
  },
  del: async (key) => {
    const client = getRedisClient();
    return client ? client.del(key) : null;
  },
};
export default redisMock;
