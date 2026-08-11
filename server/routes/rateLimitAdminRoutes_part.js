/**
 * rateLimitAdminRoutes.js
 */

import { Router } from 'express';
import { getRedisClient } from '../utils/redis.js';
import logger from '../utils/logger.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { validate } from '../middleware/validate.js';
import rateLimit from 'express-rate-limit';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import {
  overrideBodySchema,
  overrideParamsSchema,
  whitelistBodySchema,
  whitelistParamsSchema,
  blacklistBodySchema,
  blacklistParamsSchema,
  unblockBodySchema,
} from '../validators/routes/rateLimitAdminRoutesSchemas.js';

import { createClient } from 'redis';
import {
  addToWhitelist,
  removeFromWhitelist,
  addToBlacklist,
  removeFromBlacklist,
  unblockIp,
  getWhitelist,
  getBlacklist,
} from '../middleware/throttleMiddleware.js';

const router = Router();
router.use(
  rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false })
);
async function redis() {
  return getRedisClient();

async function redis() {
  try {
    return getRedisClient();
  } catch {
    return null;
  }
}


// ── Redis client (reuse connection) ──────────────────────────────────────────
let _redis = null;
async function redis() {
  try {
    return getRedisClient();
  } catch {
    return null;
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
async function scanKeys(pattern) {
  const r = await redis();
  if (!r) return [];
  const keys = [];
  return new Promise((resolve, reject) => {
    const stream = r.scanStream({ match: pattern, count: 200 });
    stream.on('data', (resultKeys) => {
      keys.push(...resultKeys);
    });
    stream.on('end', () => resolve(keys));
    stream.on('error', reject);
  return new Promise((resolve) => {
    const keys = [];
    const stream = r.scanStream({
      match: pattern,
      count: 200,
    });
    stream.on('data', (resultKeys) => {
      keys.push(...resultKeys);
    });
    stream.on('end', () => {
      resolve(keys);
    });
    stream.on('error', () => {
      resolve([]);
    });
  });

router.get(
  '/api/admin/rate-limits/status',
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
      const r = await redis();
      const keys = await scanKeys('ratelimit:*');
  for await (const key of r.scanIterator({ MATCH: pattern, COUNT: 200 })) {
    keys.push(key);
  }
  return keys;

// ── GET /api/admin/rate-limits/status ─────────────────────────────────────────
// Returns top rate-limited users/IPs and endpoint distribution.
router.get(
  '/api/admin/rate-limits/status',
  adminAuthMiddleware.requireAdmin,
  async (req, res) => {
    try {
      const r = await redis();

      // Collect all active rate-limit keys
      const keys = await scanKeys('ratelimit:*');

      const violations = [];
      const endpointCounts = {};
      const userCounts = {};

      for (const key of keys) {
        // Skip internal keys
        if (
          key.startsWith('ratelimit:whitelist') ||
          key.startsWith('ratelimit:blacklist') ||
          key.startsWith('ratelimit:autoblock') ||
          key.startsWith('ratelimit:abuse')
        )
          continue;

        const count = r ? parseInt((await r.get(key)) || '0', 10) : 0;
        const ttl = r ? await r.ttl(key) : -1;
        const parts = key.replace('ratelimit:', '').split(':');
        const identifier = parts[0];
        const endpoint = parts.slice(1).join(':') || 'global';

        violations.push({ key, identifier, endpoint, count, ttlSeconds: ttl });
        endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + count;
        userCounts[identifier] = (userCounts[identifier] || 0) + count;
      }

      const topUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([user, count]) => ({ user, count }));

      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([endpoint, count]) => ({ endpoint, count }));

      const blockedKeys = await scanKeys('ratelimit:autoblock:*');
      const autoblocked = blockedKeys.map((k) => ({
        ip: k.replace('ratelimit:autoblock:', ''),
      }));

      sendSuccess(res, {
        totalActiveKeys: violations.length,
        topUsers,
        topEndpoints,
        autoblocked,
        redisConnected: !!r,
      });
    } catch (err) {
      logger.error('rateLimitAdminRoutes /status error', { err: err.message });
      sendError(req, res, 'Failed to fetch rate limit status', 500, 'INTERNAL_ERROR');
    }
  }
);

router.get(
  '/api/admin/rate-limits/violations',
  adminAuthMiddleware.requireAdmin,

// ── GET /api/admin/rate-limits/violations ──────────────────────────────────────
// Returns recent violations list (paginated).