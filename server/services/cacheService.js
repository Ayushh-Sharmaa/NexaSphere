import Redis from "ioredis";
import logger from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let client = null;

function getClient() {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: false,
    });

    client.on("error", (err) => {
      logger.error("[cache-service] Redis error:", err.message);
    });

    client.on("connect", () => {
      logger.info("[cache-service] Connected to Redis");
    });
  }
  return client;
}

const DEFAULT_TTL = 3600; // 1 hour

export const cacheService = {
  async get(key) {
    try {
      const data = await getClient().get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error("[cache-service] Get error:", err.message);
      return null;
    }
  },

  async set(key, value, ttl = DEFAULT_TTL) {
    try {
      const serialized = JSON.stringify(value);
      await getClient().setex(key, ttl, serialized);
      return true;
    } catch (err) {
      logger.error("[cache-service] Set error:", err.message);
      return false;
    }
  },

  async del(key) {
    try {
      await getClient().del(key);
      return true;
    } catch (err) {
      logger.error("[cache-service] Del error:", err.message);
      return false;
    }
  },

  async delPattern(pattern) {
    try {
      const keys = await getClient().keys(pattern);
      if (keys.length > 0) {
        await getClient().del(...keys);
      }
      return keys.length;
    } catch (err) {
      logger.error("[cache-service] DelPattern error:", err.message);
      return 0;
    }
  },

  async exists(key) {
    try {
      return await getClient().exists(key);
    } catch (err) {
      return false;
    }
  },

  buildKey(prefix, id) {
    return `cache:${prefix}:${id}`;
  },
};

export async function invalidateCache(channel) {
  try {
    await cacheService.delPattern(`*${channel}*`);
  } catch (err) {
    logger.warn(
      `[cache-service] invalidateCache failed for ${channel}:`,
      err.message
    );
  }
}

export function localEvict() {}
export function registerNotificationSyncCallback() {}

cacheService.invalidateCache = invalidateCache;
cacheService.localEvict = localEvict;

export default cacheService;
