/**
 * Global Error Handler Middleware
 * Handles all errors in a centralized location.
 *
 * Produces the standardized error shape:
 *   { error: { code, message, details?, traceId? } }
 */

import logger from '../utils/logger.js';
import { captureException } from '../utils/sentry.js';
import { sendSlackAlert } from '../utils/slack.js';
import { trackError } from '../utils/errorTracker.js';
import { logError } from '../services/errorTrackingService.js';
import { ErrorCodes } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveUserId(req) {
  return req.user?.id || req.adminSession?.username || null;
}

/**
 * Map an HTTP status code to a machine-readable error code.
 * Used when the thrown error does not carry its own `code` property.
 */
function statusToCode(status) {
  if (status >= 500) return ErrorCodes.INTERNAL_ERROR;
  const map = {
    400: ErrorCodes.VALIDATION_ERROR,
    401: ErrorCodes.UNAUTHORIZED,
    403: ErrorCodes.FORBIDDEN,
    404: ErrorCodes.NOT_FOUND,
    409: ErrorCodes.CONFLICT,
    429: ErrorCodes.RATE_LIMITED,
    502: ErrorCodes.DEPENDENCY_ERROR,
  };
  return map[status] || ErrorCodes.INTERNAL_ERROR;
}

// ---------------------------------------------------------------------------
// Main error handler
// ---------------------------------------------------------------------------

/**
 * @param {Error}      err - Error object
 * @param {Object}     req - Express request
 * @param {Object}     res - Express response
 * @param {Function}   next - Express next
 */
const errorHandler = (err, req, res, next) => {
  // Determine error metadata
  const status = err.statusCode || err.status || 500;
  const code = err.code || statusToCode(status);
  const message =
    process.env.NODE_ENV === 'production' && status >= 500
      ? 'Internal server error'
      : err.message || 'Internal server error';
  const traceId = req.reqId || null;
  const details = err.details || undefined;

  // ---- Tracking & instrumentation ----
  const trackedError = trackError(err);
  logger.error('Tracked Error', trackedError);


  const errorLog = {
    status,
    code,
    message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: resolveUserId(req),
    traceId,
    userId: req.adminSession?.username || req.user?.id,
    timestamp: new Date().toISOString(),
    stack: err.stack,
  };

  logger.error('Global Error Handler', errorLog);

  // Transaction Recovery Audit Log
  logger.warn('Transaction Recovery Triggered', {
    endpoint: req.originalUrl,
    method: req.method,
    recoveryAction: 'ROLLBACK_REQUIRED',
    statusCode: status,
    userId: resolveUserId(req),
    timestamp: new Date().toISOString(),
  });

  if (process.env.ENABLE_ERROR_TRACKING !== 'false') {
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
    userId: req.adminSession?.username || req.user?.id,
    requestPath: req.originalUrl,
    method: req.method,
    tags: { errorType: err.name, code, status },
    extra: { errorLog },
  });

  // Slack alert for ≥500 only (avoids noise from 401 scanners, etc.)
  if (status >= 500) {
    const pathOnly = req.originalUrl.split('?')[0];
  // Send Slack alert for critical errors
  if (status >= 500 || (status === 401 && !req.user && !req.adminSession)) {
    sendSlackAlert({
      title: `${status} Error Detected`,
      message,
      url: pathOnly,
      method: req.method,
      userId: resolveUserId(req),
      userId: req.adminSession?.username || req.user?.id,
      timestamp: errorLog.timestamp,
      stack: err.stack?.substring(0, 500),
    });
  }

  // ---- Standardized error response ----
  res.status(status).json({
    success: false,
    recoveryRequired: status >= 500,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      ...(traceId && { traceId }),
      status,
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------

const notFoundHandler = (req, res) => {
  const status = 404;
  const message = `Route ${req.originalUrl} not found`;
  const traceId = req.reqId || null;

  logger.warn('404 Not Found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    traceId,
  });

  res.status(status).json({
    error: {
      code: ErrorCodes.NOT_FOUND,
      message,
      ...(traceId && { traceId }),
    },
  });
};

// ---------------------------------------------------------------------------
// Validation error formatter  (does NOT send a response — returns a shape)
// ---------------------------------------------------------------------------

/**
 * Format an array of validation errors into a consistent structure.
 *
 * @param {Array} errors - Array of validation error objects (from express-validator etc.)
 * @returns {{ status: number, message: string, errors: Array<{ field, message, value }> }}
 */
const validationErrorHandler = (errors) => {
  const formattedErrors = errors.map((err) => ({
    field: err.param,
    message: err.msg,
    value: err.value,
  }));

  logger.warn('Validation Error', { errors: formattedErrors });

  return {
    status: 400,
    message: 'Validation failed',
    errors: formattedErrors,
  };
};

// ---------------------------------------------------------------------------
// Async error wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap async route handlers so thrown errors are forwarded to `next()`.
 * @param {Function} fn - Async function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error('Async handler error', { error: err.message, stack: err.stack });
    next(err);
  });
};

}
export { errorHandler, notFoundHandler, validationErrorHandler, asyncHandler };
export {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  asyncHandler,
};
