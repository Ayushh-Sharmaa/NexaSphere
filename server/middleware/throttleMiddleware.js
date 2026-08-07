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

import { getRedisClient } from "../utils/redis.js";
import logger from "../utils/logger.js";

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
const memWhitelist = new Set(
  (process.env.RATE_LIMIT_WHITELIST || "").split(",").filter(Boolean)
);
const memBlacklist = new Set(
  (process.env.RATE_LIMIT_BLACKLIST || "").split(",").filter(Boolean)
);
const memAbuse = new Map(); // ip → { count, resetAt }
const memAutoblock = new Map(); // ip → unblocksAt (ms)
