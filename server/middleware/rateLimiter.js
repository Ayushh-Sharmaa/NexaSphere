import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../utils/redis.js'; // Adjust path if your redis utility is elsewhere
import logger from '../utils/logger.js';
import { createRateLimitStore } from '../services/rateLimitService.js';

const suspiciousIPs = new Map();

import logger from '../utils/logger.js';
import { createRateLimitStore } from '../services/rateLimitService.js';
import { apiSecurityManager } from '../utils/apiSecurityManager.js';
import { calculateRiskScore } from '../utils/threatDetection.js';

const suspiciousIPs = new Map();

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../utils/redis.js"; // Adjust path if your redis utility is elsewhere
import logger from "../utils/logger.js";
// ---------------------------------------------------------------------------
// SECURITY WARNING: Upstream Proxy Dependency
// These rate limiters rely entirely on `req.ip` mapping to individual clients.
// For this security perimeter to operate safely without spoofing vulnerabilities
// or accidental self-inflicted DoS, ensure `app.set('trust proxy', 1)` (or your
// specific proxy hop count) is explicitly initialized in the main server app entry file.
// ---------------------------------------------------------------------------

import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Safe integer parser for environment variable configuration.
// parseInt returns NaN when the env var is set to a non-numeric string
// (e.g. "ten_minutes", "0x", or a string with a leading space after trimming).
// Passing windowMs: NaN or max: NaN to express-rate-limit silently disables
// the limiter or causes a runtime throw depending on the library version.
// This helper falls back to the supplied default for any non-positive or
// non-finite parsed value.
// ---------------------------------------------------------------------------
function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// Shared env-var config for the general API limiter
// Override via API_RATE_LIMIT_WINDOW_MS and API_RATE_LIMIT_MAX in .env
// ---------------------------------------------------------------------------
const API_WINDOW_MS = parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);

const API_MAX_REQUESTS = parsePositiveInt(process.env.API_RATE_LIMIT_MAX, 100);

// Shared env-var config for the form limiter
const FORM_WINDOW_MS = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000);

const FORM_MAX_REQUESTS = parsePositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, 5);
const API_WINDOW_MS = parsePositiveInt(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  10 * 60 * 1000 // 10 minutes
);

const API_MAX_REQUESTS = parsePositiveInt(
  process.env.API_RATE_LIMIT_MAX,
  100
);

// Shared env-var config for the form limiter
const FORM_WINDOW_MS = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  10 * 60 * 1000 // 10 minutes
);

const FORM_MAX_REQUESTS = parsePositiveInt(
  process.env.RATE_LIMIT_MAX_REQUESTS,
  5
);

// ---------------------------------------------------------------------------
// Global API rate limiter — applied to every /api route
// Protects against request flooding and database connection pool exhaustion.
// Previously missing: the export did not exist, so app.use("/api", apiRateLimiter)
// received undefined and Express silently skipped the middleware entirely.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Reusable Factory Function for Consistent Error Responses & Logging
// ---------------------------------------------------------------------------
const createLimiterHandler = (logMessage, clientErrorMessage) => {
  return (req, res, _next, options) => {
    logger.warn(logMessage, {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    res.status(options.statusCode).json({
      error: clientErrorMessage,
    });
  };
};

const setRetryAfterHeader = (res, windowMs) => {
  res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
};

export const apiRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: API_WINDOW_MS,
  max: API_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:api:'),
  handler: (req, res, _next, options) => {
    logger.warn('Global API rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    res.status(options.statusCode).json({
      error: clientErrorMessage,
    });
  };
};

export const apiRateLimiter = rateLimit({
  windowMs: API_WINDOW_MS,
  max: API_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: true,
  requestPropertyName: 'apiRateLimit',
  store: createRateLimitStore('rate-limit:api:'),
  handler: (req, res, _next, options) => {
    logger.warn('Global API rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    const currentCount = (suspiciousIPs.get(req.ip) || 0) + 1;
    suspiciousIPs.set(req.ip, currentCount);

    if (currentCount >= 5) {
      logger.error('Suspicious activity detected', {
        ip: req.ip,
        attempts: currentCount,
        path: req.originalUrl || req.path,
        detectedAt: new Date().toISOString(),
      });
    }

    const riskScore = calculateRiskScore(req);

    if (riskScore > 80) {
      return res.status(429).json({
        error: 'Suspicious activity detected',
      });
    }

    res.status(options.statusCode).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// ---------------------------------------------------------------------------
// Form submission rate limiter — applied to membership, recruitment, core-team
// ---------------------------------------------------------------------------
export const formRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: FORM_WINDOW_MS,
  max: FORM_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: true,
  legacyHeaders: false,
  requestPropertyName: 'formRateLimit',
  store: createRateLimitStore('rate-limit:form:'),
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded for public form API', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });
    res.status(options.statusCode).json({
      error: 'Too many form submissions from this IP, please try again later.',
    });
  }

// Standard rate limiter for all /api/ routes: 60 requests per IP per minute
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
  },
});

// Authentication rate limiter — 5 requests per IP per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Authentication rate limit exceeded',
    'Too many login attempts, please try again after 15 minutes.'
  ),
  legacyHeaders: false,
  requestPropertyName: 'authRateLimit',
  store: createRateLimitStore('rate-limit:auth:'),
  message: {
    error: 'Too many login attempts, please try again after a minute.',
  },
  handler: createLimiterHandler(
    "Authentication rate limit exceeded",
    "Too many login attempts, please try again after a minute."
  ),
});

// Notification mutation rate limiter — 60 requests per IP per 15 minutes
export const notificationRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Notification mutation rate limit exceeded',
    'Too many notification requests, please try again later.'
  ),
  legacyHeaders: false,
  requestPropertyName: 'notificationRateLimit',
  store: createRateLimitStore('rate-limit:notification:'),
  message: {
    error: 'Too many notification requests, please try again later.',
  },
  handler: createLimiterHandler(
    "Notification mutation rate limit exceeded",
    "Too many notification requests, please try again later."
  ),
});

// Activity-event auth rate limiter: 10 requests per IP per 15 minutes.
// Applied to the publicly reachable POST/DELETE activity-event endpoints that
// require a shared password. Backs up the in-process lockout so that even
// when the server restarts the IP-level window survives in the rate-limit
// store.
export const activityAuthRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  requestPropertyName: 'activityAuthRateLimit',
  store: createRateLimitStore('rate-limit:activity-auth:'),
  handler: (req, res, next, options) => {
    logger.warn('Activity-event auth rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many attempts from this IP, please try again later.',
    });
  },
});

// Push-subscription rate limiter: 5 subscribe/unsubscribe calls per IP per
// 10 minutes. Prevents flooding the in-memory subscription Set with fake
// entries that would evict legitimate browser subscriptions.
export const subscriptionRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
// Portfolio update rate limiter — 10 requests per IP per 15 minutes
// Portfolio update rate limiter — 10 requests per IP per 15 minutes
export const portfolioRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  requestPropertyName: 'portfolioRateLimit',
  store: createRateLimitStore('rate-limit:portfolio:'),
  handler: (req, res, next, options) => {
    logger.warn("Push-subscription rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: "Too many subscription requests from this IP, please try again later.",
    });
  },
});
// Portfolio update rate limiter — 10 requests per IP per 15 minutes
  message: {
    error:
      "Too many activity auth attempts from this IP, please try again after 15 minutes.",
  },
});

export const portfolioRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(args[0], ...args.slice(1)),
    prefix: 'rl:activity:',
  }),
  store: createRateLimitStore('rl:activity:'),
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(args[0], ...args.slice(1)),
    prefix: "rl:activity:",
  }),
  handler: (req, res, next, options) => {
    logger.warn('Activity auth rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many activity authentication attempts. Please try again later.',
    });
  },
});

// Sync rate limiter: 30 requests per minute per IP.
export const syncRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:sync:'),
  handler: (req, res, next, options) => {
    logger.warn('Activity auth rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many activity authentication attempts. Please try again later.',
    });
  },
});

// Sync rate limiter: 30 requests per minute per IP.
export const syncRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:sync:'),
  handler: (req, res, next, options) => {
    logger.warn('Sync batch rate limit exceeded', {
    logger.warn("Portfolio update rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many sync requests from this IP, please try again later.',
    });
  },
});
// Sync rate limiter — 10 requests per IP per 15 minutes
export const syncRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Sync rate limit exceeded',
    'Too many sync requests from this IP, please try again later.'
  ),
});

// Sync rate limiter — 100 requests per IP per 5 minutes
export const syncRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:sync:'),
  handler: createLimiterHandler(
    'Sync rate limit exceeded',
    'Too many sync requests from this IP, please try again later.'
  ),
});

// Portfolio update rate limiter — 10 requests per IP per 15 minutes
export const portfolioRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Portfolio update rate limit exceeded',
    'Too many portfolio update attempts from this IP, please try again after 15 minutes.'
  ),
});

// Sync batch rate limiter — 30 requests per IP per 15 minutes
export const syncRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:sync:'),
  handler: createLimiterHandler('Sync rate limit exceeded', 'Too many sync requests.'),
});

// Event registration rate limiter — 100 requests per IP per hour
export const eventRegistrationIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:event-reg-ip:'),
  handler: (req, res, _next, options) => {
    logger.warn('Event registration IP rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    setRetryAfterHeader(res, options.windowMs);
    res.status(options.statusCode).json({
      error: 'Too many registration attempts. Please try again later.',
    res.status(429).json({
      error: 'Too many registration attempts from this IP. Please try again later.',
    });
  },
});

// Event registration rate limiter — 5 requests per User per minute
export const eventRegistrationUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req) => {
    // If user is authenticated, limit by user ID; otherwise fallback to IP
    return req.user?.id || req.ip;
  },
  store: createRateLimitStore('rate-limit:event-reg-user:'),
  handler: (req, res, _next, options) => {
    logger.warn('Event registration user rate limit exceeded', {
      userId: req.user?.id || 'unauthenticated',
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many registration attempts. Please try again in a minute.',
    });
  },
});

// Sync rate limiter: 5 requests per minute per IP.
export const syncRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:sync:'),
  handler: (req, res, next, options) => {
    logger.warn('Sync rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
    });
    res.status(options.statusCode).json({
      error: 'Too many sync requests. Please slow down.',
function getEventRegistrationIdentity(req) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (req.user?.id) return `user:${req.user.id}`;
  if (req.studentUser?.id) return `student:${req.studentUser.id}`;
  if (req.studentUser?.email) return `student:${String(req.studentUser.email).toLowerCase()}`;
  if (email) return `email:${email}`;
  return `ip:${req.ip}`;
}

export const eventRegistrationUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:event-reg-user:'),
  keyGenerator: getEventRegistrationIdentity,
  handler: (req, res, _next, options) => {
    logger.warn('Event registration user rate limit exceeded', {
      identity: getEventRegistrationIdentity(req),
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    setRetryAfterHeader(res, options.windowMs);
    res.status(options.statusCode).json({
      error: 'Too many registration attempts from this user. Please try again later.',
    });
  },
});

export const eventRegistrationIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:event-reg-ip:'),
  handler: (req, res, _next, options) => {
    logger.warn('Event registration IP rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    setRetryAfterHeader(res, options.windowMs);
    res.status(options.statusCode).json({
      error: 'Too many registration attempts from this IP. Please try again later.',
    });
  },
});

// Search rate limiter: 30 requests per minute per IP.
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:search:'),
  handler: (req, res, next, options) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
    });
    res.status(options.statusCode).json({
      error: 'Too many search requests. Please slow down.',
    });
  store: createRateLimitStore('rate-limit:portfolio:'),
  message: {
    error: 'Too many portfolio update attempts from this IP, please try again after 15 minutes.',
  },
});
      error: "Too many portfolio update attempts from this IP, please try again after 15 minutes.",
    });
  },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:search:'),
  handler: (req, res, _next, options) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many search requests. Please slow down.',
    });
  },
  handler: createLimiterHandler(
    "Portfolio update rate limit exceeded",
    "Too many portfolio update attempts from this IP, please try again after 15 minutes."
  ),
});

// Event registration rate limiter — 20 requests per IP per 15 minutes
export const eventRegistrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:event-registration:'),
  message: {
    error: 'Too many event registration attempts from this IP, please try again later.',
  },
});

// ---------------------------------------------------------------------------
// Startup guard — call once during server boot to catch missing exports early.
// Throws immediately if any limiter failed to initialise, preventing the silent
// "undefined middleware" failure mode that this issue was created to fix.
// ---------------------------------------------------------------------------

// Sync rate limiter: 10 batch sync requests per minute per IP (authenticated, write-heavy).
export const syncRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('rate-limit:sync:'),
  handler: (req, res, next, options) => {
    logger.warn('Sync rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
    });
    res.status(options.statusCode).json({
      error: 'Too many sync requests. Please slow down.',
    });
  },
});

export function validateLimiters() {
  const limiters = {
    apiRateLimiter,
    formRateLimiter,
    authRateLimiter,
    notificationRateLimiter,
    activityAuthRateLimiter,
    eventRegistrationLimiter,
    eventRegistrationUserLimiter,
    eventRegistrationIpLimiter,
    syncRateLimiter,
    portfolioRateLimiter,
    searchRateLimiter,
  };

  for (const [name, limiter] of Object.entries(limiters)) {
    if (typeof limiter !== 'function') {
      throw new Error(
        `Rate limiter misconfiguration: "${name}" is not a function. Check rateLimiter.js exports.`
      );
    }
  }
}
