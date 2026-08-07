import Redis from "ioredis";
import logger from "./logger.js";
import { recordCacheHit, recordCacheMiss } from "../observability/metrics.js";

let redisClient = null;

export function getRedisClient() {
  if (!redisClient) {
    if (!process.env.REDIS_URL) {
      return null;
    }
    const redisUrl = process.env.REDIS_URL;
    redisClient = new Redis(redisUrl);

    redisClient.on("error", (err) => {
      logger.error("Redis connection error:", err);
    });

    redisClient.on("connect", () => {
      logger.info("Connected to Redis");
    });
  }
  return redisClient;
}

export async function getCachedQuery(key, queryFn, ttlSeconds = 300) {
  const client = getRedisClient();

  if (!client) {
    return queryFn();
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
    logger.warn("Redis cache read error, falling back to database query:", err);
  }

  // Cache miss or Redis error — run queryFn exactly once
  const result = await queryFn();

  // Best-effort cache write
  try {
    client.set(key, JSON.stringify(result), "EX", ttlSeconds).catch((err) => {
      logger.error("Error setting Redis cache:", err);
    });
  } catch (err) {
    logger.warn("Redis cache write error:", err);
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

    stream.on("data", (resultKeys) => {
      if (resultKeys.length > 0) {
        // Delete in batches as they arrive to avoid unbounded memory usage
        const promise = client
          .del(...resultKeys)
          .then((count) => {
            deletedCount += count;
          })
          .catch((err) => {
            logger.error("Error deleting cache keys batch:", err);
          });
        deletePromises.push(promise);
      }
    });

    stream.on("end", async () => {
      try {
        await Promise.all(deletePromises);
        resolve(deletedCount);
      } catch (err) {
        reject(err);
      }
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}
