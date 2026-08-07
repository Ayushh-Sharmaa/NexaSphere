import "dotenv/config";
import { validateEnvironment } from "../utils/envValidator.js";

validateEnvironment();

import helmet from "helmet";
import express from "express";
/**
 * Error Tracking Service
 * Manages error logging, tracking, and analysis
 */

import logger from "../utils/logger.js";
import {
  captureException,
  captureMessage,
  addBreadcrumb,
} from "../utils/sentry.js";

// In-memory error store (consider using database in production)
const errorStore = {
  errors: [],
};

/**
 * Log error with full context
 * @param {Error} error - Error object
 * @param {Object} context - Request context
 */
async function logError(error, context = {}) {
  const errorData = {
    timestamp: new Date(),
    message: error.message,
    status: context.status || 500,
    stack: error.stack,
    url: context.url,
    method: context.method,
    userId: context.userId,
    userEmail: context.userEmail,
    ipAddress: context.ipAddress,
    requestBody: sanitizeData(context.requestBody),
    queryParams: truncateData(context.queryParams, 512),
    headers: sanitizeHeaders(context.headers),
  };

  // Store error
  errorStore.errors.push(errorData);

  // Limit stored errors to configured capacity limit
  const limit = (() => {
    const envLimit = parseInt(process.env.ERROR_BUFFER_LIMIT, 10);
    if (!isNaN(envLimit) && envLimit > 0) {
      return envLimit;
    }
    return 1000;
  })();

  while (errorStore.errors.length > limit) {
    errorStore.errors.shift();
  }

  // Define endpoint for tagging and logging
  const endpoint = `${errorData.method} ${errorData.url}`;

  // Log to Winston
  logger.error("Error logged", errorData);

  // Send to Sentry
  captureException(error, {
    userId: context.userId,
    requestPath: context.url,
    method: context.method,
    tags: { status: errorData.status, endpoint },
    extra: { context },
  });

  // Add breadcrumb
  addBreadcrumb({
    category: "error",
    message: error.message,
    level: "error",
    data: { status: errorData.status, url: errorData.url },
  });

  return errorData;
}

/**
 * Get error statistics
 */
function getErrorStats() {
  const total = errorStore.errors.length;
  const lastHour = errorStore.errors.filter(
    (e) => new Date() - e.timestamp < 3600000
  ).length;
  const last24Hours = errorStore.errors.filter(
    (e) => new Date() - e.timestamp < 86400000
  ).length;

  const errorsByStatusMap = {};
  const errorsByEndpointMap = {};

  for (const err of errorStore.errors) {
    const status = err.status || 500;
    errorsByStatusMap[status] = (errorsByStatusMap[status] || 0) + 1;

    const endpoint = `${err.method} ${err.url}`;
    errorsByEndpointMap[endpoint] = (errorsByEndpointMap[endpoint] || 0) + 1;
  }

  const errorsByStatus = Object.entries(errorsByStatusMap).map(
    ([status, count]) => ({
      status: parseInt(status),
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(2) : "0.00",
    })
  );

  const topEndpoints = Object.entries(errorsByEndpointMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({
      endpoint,
      errorCount: count,
    }));

  return {
    total,
    lastHour,
    last24Hours,
    errorsByStatus,
    topEndpoints,
  };
}

/**
 * Get recent errors
 * @param {number} limit - Number of errors to return
 */
function getRecentErrors(limit = 50) {
  return errorStore.errors
    .slice(-limit)
    .reverse()
    .map((err) => ({
      ...err,
      timeSince: getTimeSince(err.timestamp),
    }));
}

/**
 * Get errors for specific endpoint
 * @param {string} endpoint - Endpoint path
 * @param {number} limit - Number of errors to return
 */
function getEndpointErrors(endpoint, limit = 20) {
  return errorStore.errors
    .filter((e) => e.url === endpoint)
    .slice(-limit)
    .reverse();
}

/**
 * Get errors for specific user
 * @param {string} userId - User ID
 * @param {number} limit - Number of errors to return
 */
function getUserErrors(userId, limit = 20) {
  return errorStore.errors
    .filter((e) => e.userId === userId)
    .slice(-limit)
    .reverse();
}

/**
 * Truncate an object to a maximum JSON byte length before storing in memory.
 * Prevents a single large request body or query parameter set from consuming
 * excessive memory in the error store.
 */
function truncateData(data, maxBytes) {
  if (!data) return null;
  const str = JSON.stringify(data);
  if (str.length <= maxBytes) return data;
  try {
    return JSON.parse(str.slice(0, maxBytes));
  } catch {
    return null;
  }
}

/**
 * Sanitize sensitive data from request body
 * Uses pattern matching to catch variations like adminPassword, refreshToken, etc.
 * @param {Object} data - Request data
 */
function sanitizeData(data) {
  if (!data) return null;

  const sanitized = { ...data };
  const sensitivePatterns = [
    /password/i,
    /passwd/i,
    /pwd/i,
    /token/i,
    /secret/i,
    /apikey/i,
    /api_key/i,
    /credit.?card/i,
    /cc.?number/i,
    /card.?number/i,
    /ssn/i,
    /social.?security/i,
    /private.?key/i,
    /access.?key/i,
  ];

  for (const key of Object.keys(sanitized)) {
    for (const pattern of sensitivePatterns) {
      if (pattern.test(key)) {
        sanitized[key] = "***REDACTED***";
        break;
      }
    }
  }

  return truncateData(sanitized, 2048);
}

/**
 * Sanitize headers
 * @param {Object} headers - Request headers
 */
function sanitizeHeaders(headers) {
  if (!headers) return null;

  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string" && value.length > 500) {
      sanitized[key] = value.slice(0, 500);
    } else {
      sanitized[key] = value;
    }
  }

  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-csrf-token",
    "x-session-id",
    "x-auth-token",
    "x-access-token",
    "x-refresh-token",
    "set-cookie",
  ];

  sensitiveHeaders.forEach((header) => {
    if (sanitized[header.toLowerCase()]) {
      sanitized[header.toLowerCase()] = "***REDACTED***";
    }
  });

  return truncateData(sanitized, 2048);
}

/**
 * Get time since error occurred
 * @param {Date} timestamp - Error timestamp
 */
function getTimeSince(timestamp) {
  const seconds = Math.floor((new Date() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Clear error store
 */
function clearErrors() {
  errorStore.errors = [];
}

export {
  logError,
  getErrorStats,
  getRecentErrors,
  getEndpointErrors,
  getUserErrors,
  clearErrors,
};
