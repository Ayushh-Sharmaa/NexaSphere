import {
  createAdminSession,
  revokeAdminSession,
  startAdminSessionCleanup,
} from "../repositories/adminSessionsRepository.js";
import { getRedisClient } from "../utils/redis.js";
import crypto from "crypto";
import { getScopesForRole } from "../config/rbac.js";

// lgtm[js/weak-cryptographic-algorithm]
function safeEqual(a, b) {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();

  return crypto.timingSafeEqual(hashA, hashB);
}

let adminUsers = [];
try {
  if (process.env.ADMIN_USERS_JSON) {
    adminUsers = JSON.parse(process.env.ADMIN_USERS_JSON);
  } else {
    adminUsers = [
      {
        username: requiredEnv("ADMIN_USERNAME"),
        password: requiredStrongPassword("ADMIN_PASSWORD"),
        role: "SuperAdmin",
      },
    ];
  }
} catch (err) {
  console.error("Failed to parse ADMIN_USERS_JSON", err);
  process.exit(1);
}
const LOGIN_WINDOW_MS = parsePositiveInteger(
  process.env.ADMIN_LOGIN_WINDOW_MS,
  15 * 60 * 1000
);
const LOGIN_MAX_ATTEMPTS = parsePositiveInteger(
  process.env.ADMIN_LOGIN_MAX_ATTEMPTS,
  5
);
const LOGIN_MAX_TRACKED_IPS = parsePositiveInteger(
  process.env.ADMIN_LOGIN_MAX_TRACKED_IPS,
  10000
);
const LOGIN_CLEANUP_INTERVAL_MS = parsePositiveInteger(
  process.env.ADMIN_LOGIN_CLEANUP_INTERVAL_MS,
  15 * 60 * 1000
);

const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours — must match Java TokenService.SESSION_TTL
const REDIS_SESSION_PREFIX = "session:admin:"; // Shared namespace with Java backend

const loginAttemptsByIp = new Map();

// Periodic background cleanup of expired IPs to prevent memory exhaustion
const cleanupAttemptsTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttemptsByIp.entries()) {
    if (entry.expiresAt <= now) {
      loginAttemptsByIp.delete(ip);
    }
  }
}, LOGIN_CLEANUP_INTERVAL_MS);

// Allow Node process to exit cleanly if this timer is active
if (cleanupAttemptsTimer && typeof cleanupAttemptsTimer.unref === "function") {
  cleanupAttemptsTimer.unref();
}

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function requiredStrongPassword(name) {
  const value = requiredEnv(name);
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (value.length < 12 || !hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    throw new Error(
      `${name} must be at least 12 characters and include uppercase, lowercase, number, and symbol`
    );
  }

  return value;
}

function getClientIp(req) {
  const ip = String(req.ip || "unknown").trim();
  // Truncate to maximum 128 characters to prevent extremely large malicious headers from causing memory exhaustion
  return ip.slice(0, 128);
}

function recordLoginAttempt(ip) {
  const now = Date.now();

  // Enforce size-based bound to protect against memory exhaustion via distributed/IP-rotating brute force
  if (
    loginAttemptsByIp.size >= LOGIN_MAX_TRACKED_IPS &&
    !loginAttemptsByIp.has(ip)
  ) {
    // 1. Evict any expired entries
    for (const [key, entry] of loginAttemptsByIp.entries()) {
      if (entry.expiresAt <= now) {
        loginAttemptsByIp.delete(key);
      }
    }

    // 2. If still full, evict blocked IPs first to preserve legitimate user entries
    if (loginAttemptsByIp.size >= LOGIN_MAX_TRACKED_IPS) {
      let evictKey = null;
      for (const [key, entry] of loginAttemptsByIp.entries()) {
        if (entry.attempts > LOGIN_MAX_ATTEMPTS) {
          evictKey = key;
          break;
        }
      }

      // Fallback to oldest entry (FIFO) if no blocked IPs found
      if (!evictKey) {
        evictKey = loginAttemptsByIp.keys().next().value;
      }

      if (evictKey) {
        loginAttemptsByIp.delete(evictKey);
      }
    }
  }

  const existing = loginAttemptsByIp.get(ip);
  const attempts = existing && existing.expiresAt > now ? existing.attempts : 0;
  const entry = {
    attempts: attempts + 1,
    expiresAt: now + LOGIN_WINDOW_MS,
  };
  loginAttemptsByIp.set(ip, entry);
  return entry;
}

function getLoginAttemptState(ip) {
  const state = loginAttemptsByIp.get(ip);
  if (!state) return null;
  if (state.expiresAt <= Date.now()) {
    loginAttemptsByIp.delete(ip);
    return null;
  }
  return state;
}

function clearLoginAttempts(ip) {
  loginAttemptsByIp.delete(ip);
}

/**
 * Compute the SHA-256 hash of a token string.
 * This MUST match the Java TokenService.hashToken() algorithm exactly
 * so both services generate identical Redis keys for the same token.
 */
// lgtm[js/weak-cryptographic-algorithm]
function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

startAdminSessionCleanup();

function parseBearer(authHeader = "") {
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7).trim();
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}

/**
 * Validates admin tokens by querying the shared Redis session store directly.
 * This eliminates the need for cross-service HTTP calls to the Java backend.
 * Both Java and Node.js write sessions under the same Redis namespace:
 * session:admin:{sha256(token)}
 */
async function requireAdmin(req, res, next) {
  try {
    if (req.query.token) {
      return res.status(400).json({ error: "Do not pass tokens in URLs." });
    }

    const token =
      req.cookies?.ns_admin_token ||
      getCookie(req, "ns_admin_token") ||
      parseBearer(req.headers.authorization || "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const tokenHash = hashToken(token);
    const redisKey = REDIS_SESSION_PREFIX + tokenHash;

    const redis = getRedisClient();
    // lgtm[js/missing-rate-limiting]
    const sessionJson = await redis.get(redisKey);

    if (!sessionJson) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = JSON.parse(sessionJson);

    // Double-check expiry even though Redis TTL should auto-evict
    if (new Date(session.expiresAt) <= new Date()) {
      await redis.del(redisKey);
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.adminSession = {
      token,
      username: session.email,
      metadata: session.metadata || {},
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
    return next();
  } catch {
    return res.status(500).json({ error: "Unable to validate admin session" });
  }
}

function requireRole(allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error(
      "requireRole must be initialized with a non-empty array of allowed roles"
    );
  }

  return async (req, res, next) => {
    // Ensure the request is already authenticated (e.g. by requireAdmin)
    if (!req.adminSession) {
      return res.status(401).json({ error: "Unauthorized: No session found" });
    }

    // Assume role is attached to the session metadata, defaulting to 'user' to prevent privilege escalation
    const userRole = req.adminSession.metadata?.role || "user";

    if (!allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient privileges" });
    }

    next();
  };
}

function requireScope(requiredScope) {
  return async (req, res, next) => {
    // First, ensure they are authenticated
    await requireAdmin(req, res, (err) => {
      if (err) return next(err);

      if (!req.adminSession) {
        // Response already sent by requireAdmin
        return;
      }

      const sessionScopes = req.adminSession?.metadata?.scopes || [];
      if (!sessionScopes.includes(requiredScope)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      next();
    });
  };
}

async function login(req, res) {
  try {
    const u = String(req.body?.username || "").trim();
    const p = String(req.body?.password || "");
    const ip = getClientIp(req);

    const state = getLoginAttemptState(ip);
    if (state && state.attempts > LOGIN_MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ error: "Too many login attempts. Please wait and try again." });
    }

    const matchedUser = adminUsers.find(
      (user) => safeEqual(u, user.username) && safeEqual(p, user.password)
    );

    if (!matchedUser) {
      recordLoginAttempt(ip);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    clearLoginAttempts(ip);

    const role = matchedUser.role || "SuperAdmin";
    const scopes = getScopesForRole(role);

    // Create session in PostgreSQL (audit trail + persistence)
    const session = await createAdminSession({
      username: u,
      metadata: {
        userAgent: req.get("user-agent") || "",
        ip,
        role,
        scopes,
      },
    });

    // Write session to shared Redis for cross-service validation
    try {
      const tokenHash = hashToken(session.token);
      const redisKey = REDIS_SESSION_PREFIX + tokenHash;
      const redisPayload = JSON.stringify({
        token: tokenHash,
        email: u,
        createdAt: new Date().toISOString(),
        expiresAt: session.expiresAt,
      });
      const redis = getRedisClient();
      await redis.set(redisKey, redisPayload, "EX", SESSION_TTL_SECONDS);
    } catch (redisErr) {
      // Log but don't fail the login — PostgreSQL session is the fallback
      console.error(
        "[Admin Login] Failed to write session to Redis:",
        redisErr
      );
    }

    res.cookie("ns_admin_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(session.expiresAt),
    });

    return res.json({
      username: u,
      expiresAt: session.expiresAt,
      role,
      scopes,
    });
  } catch {
    return res.status(500).json({ error: "Unable to create admin session" });
  }
}

async function logout(req, res) {
  try {
    const token = req.adminSession?.token;
    if (token) {
      // Revoke from PostgreSQL audit store
      await revokeAdminSession(token);

      // Delete from shared Redis immediately
      try {
        const tokenHash = hashToken(token);
        const redisKey = REDIS_SESSION_PREFIX + tokenHash;
        const redis = getRedisClient();
        await redis.del(redisKey);
      } catch (redisErr) {
        console.error(
          "[Admin Logout] Failed to delete session from Redis:",
          redisErr
        );
      }
    } else {
      // In case logout is called without authentication
      return res.status(401).json({ error: "No active session to revoke" });
    }

    res.clearCookie("ns_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Unable to revoke admin session" });
  }
}

export const adminAuthMiddleware = {
  login,
  logout,
  requireAdmin,
  requireRole,
  requireScope,
  // Private test exports for auditing & validation
  _getLoginAttemptsMapSize: () => loginAttemptsByIp.size,
  _clearAllLoginAttempts: () => loginAttemptsByIp.clear(),
  _cleanupExpiredAttempts: () => {
    const now = Date.now();
    for (const [ip, entry] of loginAttemptsByIp.entries()) {
      if (entry.expiresAt <= now) {
        loginAttemptsByIp.delete(ip);
      }
    }
  },
  _getAttemptsTimer: () => cleanupAttemptsTimer,
  _safeEqual: safeEqual,
};

export { login, logout, requireAdmin, requireRole, requireScope };
