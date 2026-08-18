/**
 * settingsController.js
 *
 * Centralized platform settings controller.
 * Handles CRUD for all settings categories, validation, change history, rollback,
 * secrets management, and environment scoping.
 *
 * Usage in api.js:
 *   import settingsRouter from './routes/settingsRoutes.js';
 *   router.use('/api/admin/settings', adminAuthMiddleware.requireAdmin, settingsRouter);
 */

import { PrismaClient } from "@prisma/client";
import { getRedisClient } from "../utils/redis.js";
import crypto from "crypto";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";

let prisma;
try {
  prisma = new PrismaClient();
} catch (err) {
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "PrismaClient initialization failed (run prisma generate):",
      err.message
    );
  }
}

const redis = getRedisClient();

// ─── Redis cache helpers ────────────────────────────────────────────────────

const CACHE_TTL = 300; // 5 minutes

async function getCached(key) {
  if (!redis) return null;
  try {
    const client = getRedisClient();
    const val = client && (await client.get(key));
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function setCache(key, value) {
  if (!redis) return;
  try {
    const client = getRedisClient();
    if (client) await client.set(key, JSON.stringify(value), "EX", CACHE_TTL);
  } catch {
    // Redis unavailable — continue without cache
  }
}

async function invalidateCache(env) {
  if (!redis) return;
  try {
    const client = getRedisClient();
    if (client) await client.del(`settings:${env}`);
  } catch {
    // ignore
  }
}

// ─── Secret encryption (AES-256-GCM) ───────────────────────────────────────

const ENCRYPTION_KEY = Buffer.from(
  process.env.SETTINGS_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex"),
  "hex"
).slice(0, 32);

function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(ciphertext) {
  if (!ciphertext || !ciphertext.startsWith("enc:")) return ciphertext;
  const [, ivHex, tagHex, dataHex] = ciphertext.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(dataHex, "hex")) + decipher.final("utf8");
}

const SECRET_KEYS = new Set([
  "discord_bot_token",
  "slack_webhook_url",
  "sendgrid_api_key",
  "stripe_api_key",
  "analytics_tracking_id",
  "google_forms_webhook_secret",
]);

function maskSecrets(settings) {
  const out = { ...settings };
  for (const key of SECRET_KEYS) {
    if (out[key]) out[key] = "***REDACTED***";
  }
  return out;
}

// ─── Validation rules ────────────────────────────────────────────────────────

const VALIDATORS = {
  // General
  platform_name: (v) =>
    (typeof v === "string" && v.trim().length > 0) || "Required string",
  contact_email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email",
  support_email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email",
  max_events_per_user_per_month: (v) =>
    (Number.isInteger(v) && v >= 1 && v <= 1000) || "Must be integer 1–1000",
  max_file_upload_size_mb: (v) =>
    (Number.isInteger(v) && v >= 1 && v <= 500) || "Must be integer 1–500",
  registration_mode: (v) =>
    ["open", "invite-only", "approval-required"].includes(v) ||
    "Must be open | invite-only | approval-required",

  // Event
  default_event_capacity: (v) =>
    (Number.isInteger(v) && v >= 1 && v <= 10000) || "Must be integer 1–10000",
  maximum_event_capacity: (v) =>
    (Number.isInteger(v) && v >= 1 && v <= 10000) || "Must be integer 1–10000",
  default_rsvp_deadline_days: (v) =>
    (Number.isInteger(v) && v >= 0 && v <= 365) || "Must be integer 0–365",

  // User
  password_min_length: (v) =>
    (Number.isInteger(v) && v >= 6 && v <= 128) || "Must be integer 6–128",
  session_timeout_minutes: (v) =>
    (Number.isInteger(v) && v >= 5 && v <= 10080) || "Must be integer 5–10080",
  max_concurrent_sessions: (v) =>
    (Number.isInteger(v) && v >= 1 && v <= 20) || "Must be integer 1–20",

  // Email
  email_from_name: (v) =>
    (typeof v === "string" && v.trim().length > 0) || "Required string",
  email_from_address: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email",
  email_sending_limit_per_hour: (v) =>
    (Number.isInteger(v) && v >= 1 && v <= 100000) ||
    "Must be integer 1–100000",
};

const DEPENDENCY_RULES = [
  {
    when: { google_calendar_enabled: true },
    requires: "analytics_tracking_id",
    message: "Google Calendar requires Analytics Tracking ID to be set",
  },
];

function validateSettings(updates) {
  const errors = {};

  for (const [key, value] of Object.entries(updates)) {
    if (VALIDATORS[key]) {
      const result = VALIDATORS[key](value);
      if (result !== true) errors[key] = result;
    }
  }

  // Dependency checks
  for (const rule of DEPENDENCY_RULES) {
    const [condKey, condVal] = Object.entries(rule.when)[0];
    if (updates[condKey] === condVal && !updates[rule.requires]) {
      errors[rule.requires] = rule.message;
    }
  }

  return errors;
}

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  // General
  platform_name: "NexaSphere",
  platform_tagline: "Connect. Collaborate. Create.",
  contact_email: "contact@nexasphere.dev",
  support_email: "support@nexasphere.dev",
  default_timezone: "UTC",
  default_language: "en",
  registration_mode: "open",
  max_events_per_user_per_month: 10,
  max_file_upload_size_mb: 10,

  // Event
  default_event_capacity: 100,
  maximum_event_capacity: 5000,
  event_approval_required: false,
  allow_recurring_events: true,
  default_rsvp_deadline_days: 1,
  auto_cancel_below_minimum: false,
  photo_upload_enabled: true,

  // User
  profile_required_fields: ["name", "email"],
  password_min_length: 8,
  password_require_complexity: true,
  session_timeout_minutes: 60,
  max_concurrent_sessions: 3,
  account_deletion_policy: "soft-delete",
  two_factor_required: false,

  // Email
  email_from_name: "NexaSphere",
  email_from_address: "noreply@nexasphere.dev",
  email_reply_to: "support@nexasphere.dev",
  email_footer_text: "NexaSphere | Unsubscribe at any time",
  email_unsubscribe_text: "Click here to unsubscribe",
  email_sending_limit_per_hour: 1000,

  // Integrations
  slack_enabled: false,
  discord_enabled: false,
  analytics_enabled: false,
  google_calendar_enabled: false,
  discord_bot_token: "",
  slack_webhook_url: "",
  sendgrid_api_key: "",
  stripe_api_key: "",
  analytics_tracking_id: "",

  // Authentication
  social_login_google: false,
  social_login_github: false,
  social_login_discord: false,

  // Webhooks
  google_forms_webhook_secret: "",
};

// ─── Controller functions ─────────────────────────────────────────────────────

/**
 * GET /api/admin/settings?env=production
 * Returns all settings for the requested environment (secrets masked).
 */
export async function getSettings(req, res) {
  const env = req.query.env || process.env.NODE_ENV || "development";

  const cached = await getCached(`settings:${env}`);
  if (cached) return sendSuccess(res, { env, settings: maskSecrets(cached) });
  if (cached) return res.json({ env, settings: maskSecrets(cached) });

  const rows = await prisma.platformSetting.findMany({
    where: { environment: env },
  });

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    settings[row.key] = SECRET_KEYS.has(row.key)
      ? decryptSecret(row.value)
      : JSON.parse(row.value);
  }

  await setCache(`settings:${env}`, settings);
  return sendSuccess(res, { env, settings: maskSecrets(settings) });
  return res.json({ env, settings: maskSecrets(settings) });
}

/**
 * PUT /api/admin/settings
 * Body: { env, updates: { key: value, ... }, preview: bool }
 * Validates and (unless preview) persists updates.
 */
export async function updateSettings(req, res) {
  const {
    env = process.env.NODE_ENV || "development",
    updates,
    preview = false,
  } = req.body;

  if (!updates || typeof updates !== "object") {
    return sendError(
      req,
      res,
      "updates must be an object",
      400,
      "VALIDATION_ERROR"
    );
  }

  const errors = validateSettings(updates);
  if (Object.keys(errors).length)
    return sendError(
      req,
      res,
      "Validation failed",
      422,
      "VALIDATION_ERROR",
      errors
    );

  if (preview) return sendSuccess(res, { valid: true, preview: updates });

  const userId = req.user?.id;

  // Fetch current values for change log
  const existingRows = await prisma.platformSetting.findMany({
    where: { environment: env, key: { in: Object.keys(updates) } },
  });
  const existingMap = Object.fromEntries(
    existingRows.map((r) => [r.key, r.value])
  );

  const upserts = [];
  const logs = [];

  for (const [key, rawValue] of Object.entries(updates)) {
    const storedValue = SECRET_KEYS.has(key)
      ? encryptSecret(String(rawValue))
      : JSON.stringify(rawValue);

    upserts.push(
      prisma.platformSetting.upsert({
        where: { environment_key: { environment: env, key } },
        create: { environment: env, key, value: storedValue },
        update: { value: storedValue },
      })
    );

    logs.push(
      prisma.settingsChangeLog.create({
        data: {
          environment: env,
          key,
          previousValue: existingMap[key] ?? null,
          newValue: storedValue,
          changedById: userId,
        },
      })
    );
  }

  await prisma.$transaction([...upserts, ...logs]);
  await invalidateCache(env);
  return sendSuccess(res, { updated: Object.keys(updates).length });
}

/**
 * GET /api/admin/settings/history?env=production&key=max_events_per_user_per_month&page=1
 */
export async function getHistory(req, res) {
  const { env = "development", key, page = 1 } = req.query;
  const take = 20;
  const skip = (Number(page) - 1) * take;

  const where = { environment: env };
  if (key) where.key = key;

  const [logs, total] = await Promise.all([
    prisma.settingsChangeLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { changedBy: { select: { id: true, name: true, email: true } } },
    }),
    prisma.settingsChangeLog.count({ where }),
  ]);

  // Never expose raw secret values in history
  const sanitized = logs.map((l) => ({
    ...l,
    previousValue: SECRET_KEYS.has(l.key) ? "***REDACTED***" : l.previousValue,
    newValue: SECRET_KEYS.has(l.key) ? "***REDACTED***" : l.newValue,
  }));

  return sendSuccess(res, {
    logs: sanitized,
    total,
    page: Number(page),
    pages: Math.ceil(total / take),
  });
}

/**
 * POST /api/admin/settings/rollback
 * Body: { logId }  — restores the previousValue from that change log entry.
 */
export async function rollbackSetting(req, res) {
  const { logId } = req.body;
  if (!logId)
    return sendError(req, res, "logId required", 400, "VALIDATION_ERROR");

  const log = await prisma.settingsChangeLog.findUnique({
    where: { id: logId },
  });
  if (!log) return sendError(req, res, "Log entry not found", 404, "NOT_FOUND");
  if (log.previousValue === null)
    return sendError(
      req,
      res,
      "No previous value to roll back to",
      400,
      "VALIDATION_ERROR"
    );
  if (!logId) return res.status(400).json({ error: "logId required" });

  if (!log) return res.status(404).json({ error: "Log entry not found" });
  if (log.previousValue === null)
    return res.status(400).json({ error: "No previous value to roll back to" });

  const userId = req.user?.id;

  await prisma.$transaction([
    prisma.platformSetting.upsert({
      where: {
        environment_key: { environment: log.environment, key: log.key },
      },
      create: {
        environment: log.environment,
        key: log.key,
        value: log.previousValue,
      },
      update: { value: log.previousValue },
    }),
    prisma.settingsChangeLog.create({
      data: {
        environment: log.environment,
        key: log.key,
        previousValue: log.newValue,
        newValue: log.previousValue,
        changedById: userId,
        isRollback: true,
      },
    }),
  ]);

  await invalidateCache(log.environment);
  return sendSuccess(res, {
    success: true,
    key: log.key,
    environment: log.environment,
  });
}

/**
 * GET /api/admin/settings/export?env=production
 * Downloads settings JSON (secrets masked).
 */
export async function exportSettings(req, res) {
  const env = req.query.env || "development";
  const rows = await prisma.platformSetting.findMany({
    where: { environment: env },
  });

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    settings[row.key] = SECRET_KEYS.has(row.key)
      ? "***REDACTED***"
      : JSON.parse(row.value);
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="settings-${env}-${Date.now()}.json"`
  );
  return sendSuccess(res, {
    env,
    exportedAt: new Date().toISOString(),
    settings,
  });
}

/**
 * POST /api/admin/settings/import
 * Body: { env, settings: { key: value, ... } }
 * Imports settings from JSON (validates first; skips REDACTED secrets).
 */
export async function importSettings(req, res) {
  const { env = "development", settings } = req.body;
  if (!settings)
    return sendError(
      req,
      res,
      "settings object required",
      400,
      "VALIDATION_ERROR"
    );
  if (!settings)
    return res.status(400).json({ error: "settings object required" });

  // Drop redacted secrets
  const toImport = Object.fromEntries(
    Object.entries(settings).filter(([, v]) => v !== "***REDACTED***")
  );

  const errors = validateSettings(toImport);
  if (Object.keys(errors).length)
    return sendError(
      req,
      res,
      "Validation failed",
      422,
      "VALIDATION_ERROR",
      errors
    );

  // Re-use updateSettings logic
  req.body = { env, updates: toImport };
  return updateSettings(req, res);
}
