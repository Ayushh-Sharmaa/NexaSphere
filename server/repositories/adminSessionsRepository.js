import crypto from "crypto";

import { withDb } from "./db.js";

const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEFAULT_SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_TOUCH_THROTTLE_MS = 60 * 1000; // 1 minute default

let schemaReady = null;
let cleanupTimer = null;

// Bounded in-memory map to throttle last_seen_at updates (prevents MVCC bloat & lock storms)
const lastSeenThrottleMap = new Map();

function getSessionTtlMs() {
  const value = Number(process.env.ADMIN_SESSION_TTL_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SESSION_TTL_MS;
}

function getSessionIdleTimeoutMs() {
  const value = Number(process.env.ADMIN_SESSION_IDLE_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_SESSION_IDLE_TIMEOUT_MS;
}

function getCleanupIntervalMs() {
  const value = Number(process.env.ADMIN_SESSION_CLEANUP_INTERVAL_MS);
  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_CLEANUP_INTERVAL_MS;
}

function getTouchThrottleMs() {
  const value = Number(process.env.ADMIN_SESSION_TOUCH_THROTTLE_MS);
  return Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_TOUCH_THROTTLE_MS;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

let lastCleanupTime = 0;

/**
 * Execute a throttled, lazy database cleanup of expired and revoked sessions.
 * In serverless environments, this guarantees that sessions are regularly swept.
 * @param {boolean} forceAwait - If true, blocks request execution until the delete query completes.
 */
export async function triggerLazyCleanup(forceAwait = false) {
  const now = Date.now();
  const interval = getCleanupIntervalMs();
  if (now - lastCleanupTime < interval) {
    return;
  }
  lastCleanupTime = now;

  const promise = cleanupExpiredAdminSessions().catch((error) => {
    console.error("[Admin Session Cleanup] Lazy cleanup failed", error);
  });

  if (forceAwait) {
    await promise;
  }
}

async function ensureSchema(client) {
  await client.query(`
    create table if not exists admin_sessions (
      token_hash text primary key,
      username text not null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      last_seen_at timestamptz not null default now(),
      expires_at timestamptz not null,
      revoked_at timestamptz
    )
  `);

  await client.query(
    "create index if not exists idx_admin_sessions_expires_at on admin_sessions (expires_at)"
  );
  await client.query(
    "create index if not exists idx_admin_sessions_revoked_at on admin_sessions (revoked_at)"
  );
}

async function ensureReady() {
  if (!schemaReady) {
    schemaReady = withDb(async (client) => {
      await ensureSchema(client);
    }).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }

  return schemaReady;
}

export async function createAdminSession({ username, metadata = {} }) {
  await ensureReady();

  // Force await cleanup on new sessions to guarantee cleanup under serverless starts
  await triggerLazyCleanup(true);

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const ttlMs = getSessionTtlMs();
  const expiresAt = new Date(Date.now() + ttlMs);

  await withDb(async (client) => {
    await client.query(
      `insert into admin_sessions (token_hash, username, metadata, expires_at)
       values ($1, $2, $3, $4)
       on conflict (token_hash) do update set
         username = excluded.username,
         metadata = excluded.metadata,
         created_at = now(),
         last_seen_at = now(),
         expires_at = excluded.expires_at,
         revoked_at = null`,
      [tokenHash, username, metadata, expiresAt]
    );
  });

  return {
    token,
    username,
    expiresAt: expiresAt.toISOString(),
    ttlMs,
  };
}

export async function getAdminSession(token) {
  if (!token) return null;
  await ensureReady();

  // Run non-blocking background lazy cleanup on regular authentications
  triggerLazyCleanup(false);

  const tokenHash = hashToken(token);
  return withDb(async (client) => {
    const { rows } = await client.query(
      `select token_hash, username, metadata, created_at, last_seen_at, expires_at
       from admin_sessions
       where token_hash = $1
         and revoked_at is null
         and expires_at > now()
         and last_seen_at > now() - ($2::text || ' milliseconds')::interval`,
      [tokenHash, getSessionIdleTimeoutMs()]
    );

    if (!rows.length) {
      lastSeenThrottleMap.delete(tokenHash);
      await client.query(
        "delete from admin_sessions where token_hash = $1 and (expires_at <= now() or revoked_at is not null)",
        [tokenHash]
      );
      return null;
    }

    const row = rows[0];
    const nowMs = Date.now();
    const lastUpdate = lastSeenThrottleMap.get(tokenHash);
    const throttleMs = getTouchThrottleMs();

    if (!lastUpdate || nowMs - lastUpdate >= throttleMs) {
      lastSeenThrottleMap.set(tokenHash, nowMs);

      // Async non-blocking deferred persistence: execute outside the request query thread context
      withDb(async (dbClient) => {
        await dbClient.query(
          "update admin_sessions set last_seen_at = now() where token_hash = $1",
          [tokenHash]
        );
      }).catch((error) => {
        console.error(
          "Failed to update admin session last_seen_at asynchronously:",
          error
        );
      });
    }

    // Bounded memory defense: evict oldest entry instead of clearing the entire map,
    // which would cause a thundering herd of UPDATE queries from the next 1000+ requests
    if (lastSeenThrottleMap.size > 1000) {
      const oldestKey = lastSeenThrottleMap.keys().next().value;
      if (oldestKey) lastSeenThrottleMap.delete(oldestKey);
    }

    return {
      token: token,
      username: row.username,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
    };
  });
}

export async function revokeAdminSession(token) {
  if (!token) return false;
  await ensureReady();

  // Force await cleanup on sign-outs since they are infrequent and state-changing
  await triggerLazyCleanup(true);

  const tokenHash = hashToken(token);
  lastSeenThrottleMap.delete(tokenHash);

  return withDb(async (client) => {
    const { rowCount } = await client.query(
      "update admin_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null",
      [tokenHash]
    );
    return rowCount > 0;
  });
}

export async function listAdminSessions(username) {
  if (!username) return [];
  await ensureReady();
  await triggerLazyCleanup(false);

  return withDb(async (client) => {
    const { rows } = await client.query(
      `select token_hash, username, metadata, created_at, last_seen_at, expires_at
       from admin_sessions
       where username = $1
         and revoked_at is null
         and expires_at > now()
         and last_seen_at > now() - ($2::text || ' milliseconds')::interval
       order by last_seen_at desc
       limit 50`,
      [username, getSessionIdleTimeoutMs()]
    );

    return rows.map((row) => ({
      id: row.token_hash.slice(0, 16),
      username: row.username,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
    }));
  });
}

export async function revokeAdminSessionById(username, sessionId) {
  if (!username || !sessionId) return null;
  await ensureReady();

  return withDb(async (client) => {
    const { rows } = await client.query(
      `update admin_sessions
       set revoked_at = now()
       where username = $1
         and token_hash like $2
         and revoked_at is null
       returning token_hash`,
      [username, `${sessionId}%`]
    );
    return rows[0]?.token_hash || null;
  });
}

export async function revokeOtherAdminSessions(username, currentToken) {
  if (!username || !currentToken) return { count: 0, tokenHashes: [] };
  await ensureReady();

  const currentHash = hashToken(currentToken);
  lastSeenThrottleMap.clear();

  return withDb(async (client) => {
    const { rows, rowCount } = await client.query(
      `update admin_sessions
       set revoked_at = now()
       where username = $1
         and token_hash <> $2
         and revoked_at is null
       returning token_hash`,
      [username, currentHash]
    );
    return {
      count: rowCount,
      tokenHashes: rows.map((row) => row.token_hash).filter(Boolean),
    };
  });
}

export async function cleanupExpiredAdminSessions() {
  await ensureReady();
  lastSeenThrottleMap.clear(); // Prune all throttled session updates to free memory

  return withDb(async (client) => {
    const { rowCount } = await client.query(
      "delete from admin_sessions where expires_at <= now() or revoked_at is not null"
    );
    return rowCount;
  });
}

export function startAdminSessionCleanup() {
  if (cleanupTimer) return cleanupTimer;

  // Prevent background interval leaks and runtime warnings in serverless functions
  const isServerless = !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.NETLIFY ||
    process.env.FUNCTIONS_SIGNATURE
  );

  if (isServerless) {
    console.log(
      "[Admin Session Cleanup] Serverless environment detected. Skipping background interval timer."
    );
    return null;
  }

  const intervalMs = getCleanupIntervalMs();
  cleanupTimer = setInterval(() => {
    cleanupExpiredAdminSessions().catch((error) => {
      console.error("Failed to clean up admin sessions", error);
    });
  }, intervalMs);

  cleanupTimer.unref?.();
  return cleanupTimer;
}
