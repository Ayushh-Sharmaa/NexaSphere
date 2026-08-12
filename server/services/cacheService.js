import Redis from 'ioredis';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

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

    client.on('error', (err) => {
      logger.error('[cache-service] Redis error:', err.message);
    });

    client.on('connect', () => {
      logger.info('[cache-service] Connected to Redis');
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
      logger.error('[cache-service] Get error:', err.message);
      return null;
    }
  },

  async set(key, value, ttl = DEFAULT_TTL) {
    try {
      const serialized = JSON.stringify(value);
      await getClient().setex(key, ttl, serialized);
      return true;
    } catch (err) {
      logger.error('[cache-service] Set error:', err.message);
      return false;
    }
  },

  async del(key) {
    try {
      await getClient().del(key);
      return true;
    } catch (err) {
      logger.error('[cache-service] Del error:', err.message);
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
      logger.error('[cache-service] DelPattern error:', err.message);
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

// In-memory cache store
// Entry shape: { value, expiresAt, version }
const cacheStore = new Map();

// In-memory cache generation/version counters for shared validation
const cacheVersions = new Map();

// Default cache TTL: 5 minutes (300,000 ms)

// Aggressive cache TTL: 30 seconds (30,000 ms)
const AGGRESSIVE_TTL = 30000;

let pgListener = null;
let notificationSyncCallback = null;

/**
 * Generate a unique version string/timestamp
 */
function nextVersion() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

/**
 * Local cache eviction
 */
export function localEvict(channel) {
  const version = nextVersion();
  cacheVersions.set(channel, version);

  let evictedCount = 0;
  for (const key of cacheStore.keys()) {
    if (key.startsWith(`${channel}:`)) {
      cacheStore.delete(key);
      evictedCount++;
    }
  }

  // Also support full channel invalidation
  if (cacheStore.has(channel)) {
    cacheStore.delete(channel);
    evictedCount++;
  }

  logger.info(
    `[Cache Service] Local cache evicted for channel "${channel}" (${evictedCount} entries). New version: ${version}`
  );
}

/**
 * Broadcast invalidation to all instances via PostgreSQL NOTIFY
 */
export async function invalidateCache(channel) {
  // Evict locally first to guarantee zero delay on the current instance
  localEvict(channel);

  try {
    await withDb(async (client) => {
      const escapedPayload = channel.replace(/'/g, "''");
      await client.query(`NOTIFY cache_invalidation, '${escapedPayload}'`);
    });
  } catch (err) {
    logger.warn(
      `[Cache Service] Distributed invalidation broadcast failed for channel "${channel}" (handled locally):`,
      err.message
    );
  }
}

/**
 * Handle incoming distributed invalidation
 */
function handleIncomingInvalidation(channel) {
  logger.info(
    `[Cache Service] Received distributed invalidation notification for channel "${channel}"`
  );
  localEvict(channel);
}

/**
 * Register notification sync callback
 */
export function registerNotificationSyncCallback(cb) {
  notificationSyncCallback = cb;
}

/**
 * Broadcast notification change to all instances
 */
export async function broadcastNotificationSync(action, userId, payload) {
  try {
    const message = JSON.stringify({ action, userId, payload });
    await withDb(async (client) => {
      const escapedMessage = message.replace(/'/g, "''");
      await client.query(`NOTIFY notification_sync, '${escapedMessage}'`);
    });
  } catch (err) {
    logger.warn(
      "[Cache Service] Distributed notification sync broadcast failed:",
      err.message
    );
  }
}

/**
 * Handle incoming notification sync
 */
function handleIncomingNotificationSync(msg) {
  if (notificationSyncCallback) {
    logger.info(
      `[Cache Service] Received distributed notification sync event: ${msg.action} for user: ${msg.userId}`
    );
    notificationSyncCallback(msg.action, msg.userId, msg.payload);
  }
}

/**
 * Initialize distributed pub/sub listener client
 */
export async function initCacheListener() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.info(
      "[Cache Service] DATABASE_URL not set. Running in local-only cache consistency mode."
    );
    return;
  }

  if (pgListener) {
    try {
      await pgListener.end();
    } catch {
      // ignore
    }
  }

  try {
    pgListener = new pg.Client({ connectionString: databaseUrl });
    await pgListener.connect();
    await pgListener.query("LISTEN cache_invalidation");
    await pgListener.query("LISTEN notification_sync");

    pgListener.on("notification", (msg) => {
      try {
        if (msg.channel === "cache_invalidation") {
          handleIncomingInvalidation(msg.payload);
        } else if (msg.channel === "notification_sync") {
          handleIncomingNotificationSync(JSON.parse(msg.payload));
        }
      } catch (err) {
        logger.error(
          "[Cache Service] Error processing distributed event:",
          err.message
        );
      }
    });

    pgListener.on("error", (err) => {
      logger.error(
        "[Cache Service] Listener client error, reconnecting...",
        err.message
      );
      setTimeout(initCacheListener, 5000);
    });

    logger.info(
      "[Cache Service] PostgreSQL cache and notification synchronization listener started."
    );
  } catch (err) {
    logger.error(
      "[Cache Service] Failed to initialize PostgreSQL listener:",
      err.message
    );
    // Retry connection
    setTimeout(initCacheListener, 10000);
  }
}

/**
 * Get cached entry
 */
export function get(key) {
  const entry = cacheStore.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return undefined;
  }

  return entry.value;
}

/**
 * Set cached entry
 */
export function set(key, value, options = {}) {
  const ttl = options.ttl || DEFAULT_TTL;
  const expiresAt = Date.now() + ttl;

  // Extract channel from key prefix (e.g. "events:list" -> "events")
  const channel = key.split(":")[0];
  const version = cacheVersions.get(channel) || "v0";

  cacheStore.set(key, {
    value,
    expiresAt,
    version,
  });
}

/**
 * Get current version of a channel/resource
 */
export function getChannelVersion(channel) {
  if (!cacheVersions.has(channel)) {
    cacheVersions.set(channel, "v0");
  }
  return cacheVersions.get(channel);
}

/**
 * Utility function to end the listener on process shutdown
 */
export async function closeCacheListener() {
  if (pgListener) {
    try {
      await pgListener.end();
      logger.info("[Cache Service] PostgreSQL listener connection closed.");
    } catch (err) {
      logger.error(
        "[Cache Service] Error closing listener connection:",
        err.message
      );
    }
    pgListener = null;
  }
}

export default {
  get,
  set,
  localEvict,
  invalidateCache,
  initCacheListener,
  closeCacheListener,
  registerNotificationSyncCallback,
  broadcastNotificationSync,
  getChannelVersion,
  DEFAULT_TTL,
  AGGRESSIVE_TTL,
};
