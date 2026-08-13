import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../utils/redis.js"; // Adjust path if your redis utility is elsewhere
import logger from "../utils/logger.js";
import { createRateLimitStore } from "../services/rateLimitService.js";

const suspiciousIPs = new Map();

import { apiSecurityManager } from "../utils/apiSecurityManager.js";
import { calculateRiskScore } from "../utils/threatDetection.js";

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// Shared env-var config for the general API limiter
// Override via API_RATE_LIMIT_WINDOW_MS and API_RATE_LIMIT_MAX in .env
// ---------------------------------------------------------------------------
const API_WINDOW_MS = parsePositiveInt(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
);

const API_MAX_REQUESTS = parsePositiveInt(process.env.API_RATE_LIMIT_MAX, 100);

// Shared env-var config for the form limiter
const FORM_WINDOW_MS = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  10 * 60 * 1000
);

const FORM_MAX_REQUESTS = parsePositiveInt(
  process.env.RATE_LIMIT_MAX_REQUESTS,
  5
);
(process.env.API_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000); // 10 minutes

(process.env.API_RATE_LIMIT_MAX, 100);

// Shared env-var config for the form limiter
(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000); // 10 minutes

(process.env.RATE_LIMIT_MAX_REQUESTS, 5);

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
  res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
};

export const apiRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === "test",
  windowMs: API_WINDOW_MS,
  max: API_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore("rate-limit:api:"),
  handler: (req, res, _next, options) => {
    logger.warn("Global API rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    res.status(options.statusCode).json({
      error: clientErrorMessage,
    });
  },
});
export const formRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === "test",
  windowMs: FORM_WINDOW_MS,
  max: FORM_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: true,
  legacyHeaders: false,
  requestPropertyName: "formRateLimit",
  store: createRateLimitStore("rate-limit:form:"),
  handler: (req, res, _next, options) => {
    logger.warn("Rate limit exceeded for public form API", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });
    res.status(options.statusCode).json({
      error: "Too many form submissions from this IP, please try again later.",
    });
  },
});

// Standard rate limiter for all /api/ routes: 60 requests per IP per minute

// Authentication rate limiter — 5 requests per IP per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === "test",
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    "Authentication rate limit exceeded",
    "Too many login attempts, please try again after 15 minutes."
  ),
  legacyHeaders: false,
  requestPropertyName: "authRateLimit",
  store: createRateLimitStore("rate-limit:auth:"),
  message: {
    error: "Too many login attempts, please try again after a minute.",
  },
  handler: createLimiterHandler(
    "Authentication rate limit exceeded",
    "Too many login attempts, please try again after a minute."
  ),
});

// Notification mutation rate limiter — 60 requests per IP per 15 minutes
export const notificationRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === "test",
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    "Notification mutation rate limit exceeded",
    "Too many notification requests, please try again later."
  ),
  legacyHeaders: false,
  requestPropertyName: "notificationRateLimit",
  store: createRateLimitStore("rate-limit:notification:"),
  message: {
    error: "Too many notification requests, please try again later.",
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
  skip: () => process.env.NODE_ENV === "test",
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  requestPropertyName: "activityAuthRateLimit",
  store: createRateLimitStore("rate-limit:activity-auth:"),
  handler: (req, res, next, options) => {
    logger.warn("Activity-event auth rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: "Too many attempts from this IP, please try again later.",
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
  handler: (req, res, next, options) => {
    logger.warn("Push-subscription rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error:
        "Too many subscription requests from this IP, please try again later.",
    });
  },
});

export const portfolioRateLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === "test",
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  requestPropertyName: "portfolioRateLimit",
  store: createRateLimitStore("rate-limit:portfolio:"),
  handler: (req, res, next, options) => {
    logger.warn("Portfolio update rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error:
        "Too many portfolio updates from this IP, please try again after 15 minutes.",
    });
  },
});

export const syncRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore("rate-limit:sync:"),
  handler: (req, res, next, options) => {
    logger.warn("Sync rate limit exceeded", {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: "Too many sync attempts. Please try again later.",
    });
  },
});

export const eventRegistrationIpLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === "test",
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore("rate-limit:event-reg-ip:"),
  handler: (req, res, _next, options) => {
    setRetryAfterHeader(res, options.windowMs);
    res.status(options.statusCode).json({
      error: "Too many registration attempts. Please try again later.",
    });
  },
});

export const eventRegistrationUserLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === "test",
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  store: createRateLimitStore("rate-limit:event-reg-user:"),
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: "Too many registration attempts. Please try again in a minute.",
    });
  },
});
