/**
 * rateLimitAdminRoutes.js
 */

import { Router } from "express";
import { getRedisClient } from "../utils/redis.js";
import logger from "../utils/logger.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import { validate } from "../middleware/validate.js";
import rateLimit from "express-rate-limit";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";
import {
  overrideBodySchema,
  overrideParamsSchema,
  whitelistBodySchema,
  whitelistParamsSchema,
  blacklistBodySchema,
  blacklistParamsSchema,
  unblockBodySchema,
} from "../validators/routes/rateLimitAdminRoutesSchemas.js";
import {
  addToWhitelist,
  removeFromWhitelist,
  addToBlacklist,
  removeFromBlacklist,
  unblockIp,
  getWhitelist,
  getBlacklist,
} from "../middleware/throttleMiddleware.js";

const router = Router();
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
async function redis() {
  return getRedisClient();
}

async function scanKeys(pattern) {
  const r = await redis();
  if (!r) return [];
  const keys = [];
  return new Promise((resolve, reject) => {
    const stream = r.scanStream({ match: pattern, count: 200 });
    stream.on("data", (resultKeys) => {
      keys.push(...resultKeys);
    });
    stream.on("end", () => resolve(keys));
    stream.on("error", reject);
  });
}

router.get(
  "/api/admin/rate-limits/status",
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const r = await redis();
      const keys = await scanKeys("ratelimit:*");
      const violations = [];
      const endpointCounts = {};
      const userCounts = {};

      for (const key of keys) {
        if (
          key.startsWith("ratelimit:whitelist") ||
          key.startsWith("ratelimit:blacklist") ||
          key.startsWith("ratelimit:autoblock") ||
          key.startsWith("ratelimit:abuse")
        )
          continue;

        const count = r ? parseInt((await r.get(key)) || "0", 10) : 0;
        const ttl = r ? await r.ttl(key) : -1;
        const parts = key.replace("ratelimit:", "").split(":");
        const identifier = parts[0];
        const endpoint = parts.slice(1).join(":") || "global";

        violations.push({ key, identifier, endpoint, count, ttlSeconds: ttl });
        endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + count;
        userCounts[identifier] = (userCounts[identifier] || 0) + count;
      }

      const topUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([identifier, count]) => ({ identifier, count }));

      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([endpoint, count]) => ({ endpoint, count }));

      const blockedKeys = await scanKeys("ratelimit:autoblock:*");
      const autoblocked = blockedKeys.map((k) => ({
        ip: k.replace("ratelimit:autoblock:", ""),
      }));

      sendSuccess(res, {
        totalActiveKeys: violations.length,
        topUsers,
        topEndpoints,
        autoblocked,
        redisConnected: !!r,
      });
    } catch (err) {
      logger.error("rateLimitAdminRoutes /status error", { err: err.message });
      sendError(
        req,
        res,
        "Failed to fetch rate limit status",
        500,
        "INTERNAL_ERROR"
      );
    }
  }
);

router.get(
  "/api/admin/rate-limits/violations",
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const r = await redis();
      const keys = await scanKeys("ratelimit:*");
      const rows = [];

      for (const key of keys) {
        if (
          key.includes("whitelist") ||
          key.includes("blacklist") ||
          key.includes("autoblock")
        )
          continue;
        const count = r ? parseInt((await r.get(key)) || "0", 10) : 0;
        const ttl = r ? await r.ttl(key) : -1;
        const parts = key.replace("ratelimit:", "").split(":");
        rows.push({
          identifier: parts[0],
          endpoint: parts.slice(1).join(":") || "global",
          count,
          ttlSeconds: ttl,
          timestamp: new Date(
            Date.now() - (ttl > 0 ? (60 - ttl) * 1000 : 0)
          ).toISOString(),
        });
      }

      rows.sort((a, b) => b.count - a.count);
      const start = (parseInt(page) - 1) * parseInt(limit);
      const paginated = rows.slice(start, start + parseInt(limit));
      sendSuccess(res, {
        total: rows.length,
        page: parseInt(page),
        data: paginated,
      });
    } catch (err) {
      logger.error("rateLimitAdminRoutes /violations error", {
        err: err.message,
      });
      sendError(req, res, "Failed to fetch violations", 500, "INTERNAL_ERROR");
    }
  }
);

router.post(
  "/api/admin/rate-limits/override",
  validate(overrideBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { identifier, limitPerMinute } = req.body;

      const r = await redis();
      if (r)
        await r.set(
          `ratelimit:override:${identifier}`,
          String(limitPerMinute),
          { EX: 86400 }
        );

      logger.info("Rate limit override set", {
        identifier,
        limitPerMinute,
        by: req.adminSession?.adminId,
      });
      sendSuccess(res, { success: true, identifier, limitPerMinute });
    } catch (err) {
      logger.error("rateLimitAdminRoutes /override error", {
        err: err.message,
      });
      sendError(req, res, "Failed to set override", 500, "INTERNAL_ERROR");
    }
  }
);

router.delete(
  "/api/admin/rate-limits/override/:identifier",
  validate(overrideParamsSchema, "params"),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const r = await redis();
      if (r) await r.del(`ratelimit:override:${req.params.identifier}`);
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, "Failed to remove override", 500, "INTERNAL_ERROR");
    }
  }
);

router.get(
  "/api/admin/rate-limits/whitelist",
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      sendSuccess(res, { whitelist: await getWhitelist() });
    } catch (err) {
      sendError(req, res, "Failed to fetch whitelist", 500, "INTERNAL_ERROR");
    }
  }
);

router.post(
  "/api/admin/rate-limits/whitelist",
  validate(whitelistBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { ip } = req.body;
      await addToWhitelist(ip);
      logger.info("IP whitelisted", { ip, by: req.adminSession?.adminId });
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, "Failed to add to whitelist", 500, "INTERNAL_ERROR");
    }
  }
);

router.delete(
  "/api/admin/rate-limits/whitelist/:ip",
  validate(whitelistParamsSchema, "params"),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      await removeFromWhitelist(req.params.ip);
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(
        req,
        res,
        "Failed to remove from whitelist",
        500,
        "INTERNAL_ERROR"
      );
    }
  }
);

router.get(
  "/api/admin/rate-limits/blacklist",
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      sendSuccess(res, { blacklist: await getBlacklist() });
    } catch (err) {
      sendError(req, res, "Failed to fetch blacklist", 500, "INTERNAL_ERROR");
    }
  }
);

router.post(
  "/api/admin/rate-limits/blacklist",
  validate(blacklistBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { ip } = req.body;
      await addToBlacklist(ip);
      logger.info("IP blacklisted", { ip, by: req.adminSession?.adminId });
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, "Failed to add to blacklist", 500, "INTERNAL_ERROR");
    }
  }
);

router.delete(
  "/api/admin/rate-limits/blacklist/:ip",
  validate(blacklistParamsSchema, "params"),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      await removeFromBlacklist(req.params.ip);
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(
        req,
        res,
        "Failed to remove from blacklist",
        500,
        "INTERNAL_ERROR"
      );
    }
  }
);

router.post(
  "/api/admin/rate-limits/unblock",
  validate(unblockBodySchema),
  adminAuthMiddleware.requireAdmin,

  async (req, res) => {
    try {
      const { ip } = req.body;
      await unblockIp(ip);
      logger.info("IP auto-block lifted", {
        ip,
        by: req.adminSession?.adminId,
      });
      sendSuccess(res, { success: true });
    } catch (err) {
      sendError(req, res, "Failed to unblock IP", 500, "INTERNAL_ERROR");
    }
  }
);

export default router;
