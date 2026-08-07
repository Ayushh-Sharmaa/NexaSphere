/**
 * Global Error Handler Middleware
 * Handles all errors in a centralized location
 */

import logger from "../utils/logger.js";
import { captureException } from "../utils/sentry.js";
import { sendSlackAlert } from "../utils/slack.js";
import { trackError } from "../utils/errorTracker.js";
import { logError } from "../services/errorTrackingService.js";

function resolveUserId(req) {
  return req.user?.id || req.adminSession?.username || null;
}

/**
 * Main error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const errorHandler = (err, req, res, next) => {
  // Determine error status code
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const trackedError = trackError(err);
  logger.error("Tracked Error", trackedError);

  // Log error details
  const errorLog = {
    status,
    message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: resolveUserId(req),
    timestamp: new Date().toISOString(),
    stack: err.stack,
  };

  logger.error("Global Error Handler", errorLog);

  // Transaction Recovery Audit Log
  logger.warn("Transaction Recovery Triggered", {
    endpoint: req.originalUrl,
    method: req.method,
    recoveryAction: "ROLLBACK_REQUIRED",
    statusCode: status,
    userId: resolveUserId(req),
    timestamp: new Date().toISOString(),
  });

  if (process.env.ENABLE_ERROR_TRACKING !== "false") {
    logError(err, {
      status,
      url: req.originalUrl,
      method: req.method,
      userId: resolveUserId(req),
      ipAddress: req.ip,
      headers: req.headers,
      queryParams: req.query,
      requestBody: req.body,
    });
  }

  // Capture to Sentry
  captureException(err, {
    userId: resolveUserId(req),
    requestPath: req.originalUrl,
    method: req.method,
    tags: { errorType: err.name, status },
    extra: { errorLog },
  });

  // Send Slack alert for server-side incidents only.
  // 401 responses are expected client behavior (bots, scanners, health checks,
  // and users acting before login) and previously fired an alert for every
  // unauthenticated request, flooding the channel and masking real incidents.
  // Restricting alerts to status >= 500 keeps the signal limited to genuine
  // server faults. The query string is stripped from the alerted URL so any
  // sensitive query parameter values are not forwarded to Slack.
  if (status >= 500) {
    const pathOnly = req.originalUrl.split("?")[0];
    sendSlackAlert({
      title: `🚨 ${status} Error Detected`,
      message,
      url: pathOnly,
      method: req.method,
      userId: resolveUserId(req),
      timestamp: errorLog.timestamp,
      stack: err.stack?.substring(0, 500),
    });
  }

  // Send response
  res.status(status).json({
    success: false,
    recoveryRequired: status >= 500,
    error: {
      status,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const notFoundHandler = (req, res) => {
  const status = 404;
  const message = `Route ${req.originalUrl} not found`;

  logger.warn("404 Not Found", {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
    },
  });
};

/**
 * Validation error handler
 * @param {Array} errors - Array of validation errors
 */
const validationErrorHandler = (errors) => {
  const formattedErrors = errors.map((err) => ({
    field: err.param,
    message: err.msg,
    value: err.value,
  }));

  logger.warn("Validation Error", { errors: formattedErrors });

  return {
    status: 400,
    message: "Validation failed",
    errors: formattedErrors,
  };
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error("Async handler error", {
      error: err.message,
      stack: err.stack,
    });
    next(err);
  });
};

export { errorHandler, notFoundHandler, validationErrorHandler, asyncHandler };
