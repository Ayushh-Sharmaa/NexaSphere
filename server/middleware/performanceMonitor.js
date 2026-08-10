import logger from '../utils/logger.js';
import { captureMessage, addBreadcrumb } from '../utils/sentry.js';

import { recordSlowQuery } from '../utils/queryLogger.js';

/**
 * Simple time-windowed metrics tracker
 * Accumulates counts and times within a time window
 */
class TimeWindowMetrics {
  constructor({ windowSizeMs }) {
    this.windowSizeMs = windowSizeMs;
    this.buckets = [];
    this.lastReset = Date.now();
  }

  _prune() {
    const now = Date.now();
    this.buckets = this.buckets.filter((b) => now - b.timestamp <= this.windowSizeMs);
  }

  addRequest(durationMs, isError = false) {
    const now = Date.now();
    if (now - this.lastReset > this.windowSizeMs) {
      this.buckets = [];
      this.lastReset = now;
    }
    this.buckets.push({ durationMs, isError, timestamp: now });
  }

  getCount() {
    this._prune();
    return this.buckets.length;
  }
  getErrorCount() {
    this._prune();
    return this.buckets.filter((b) => b.isError).length;
  }
  getTotalTime() {
    this._prune();
    return this.buckets.reduce((sum, b) => sum + b.durationMs, 0);
  }
  getCount() { this._prune(); return this.buckets.length; }
  getErrorCount() { this._prune(); return this.buckets.filter((b) => b.isError).length; }
  getTotalTime() { this._prune(); return this.buckets.reduce((sum, b) => sum + b.durationMs, 0); }

  getAverageTime() {
    const count = this.getCount();
    return count > 0 ? this.getTotalTime() / count : 0;
  }

  getErrorRate() {
    const count = this.getCount();
    return count > 0 ? (this.getErrorCount() / count) * 100 : 0;
  }

  getPercentiles() {
    this._prune();
    const sorted = [...this.buckets].sort((a, b) => a.durationMs - b.durationMs);
    const len = sorted.length;
    if (len === 0) return { p50: 0, p95: 0, p99: 0 };
    return {
      p50: sorted[Math.floor(len * 0.5)].durationMs,
      p95: sorted[Math.floor(len * 0.95)].durationMs,
      p99: sorted[Math.floor(len * 0.99)].durationMs,
    };
  }
}

/**
 * Endpoint-specific metrics with multiple time windows
 */
class EndpointMetrics {
  constructor() {
    this.fiveMin = new TimeWindowMetrics({ windowSizeMs: 5 * 60 * 1000 });
    this.oneHour = new TimeWindowMetrics({ windowSizeMs: 60 * 60 * 1000 });
    this.twentyFourHour = new TimeWindowMetrics({ windowSizeMs: 24 * 60 * 60 * 1000 });
  }

  addRequest(durationMs, isError = false) {
    this.fiveMin.addRequest(durationMs, isError);
    this.oneHour.addRequest(durationMs, isError);
    this.twentyFourHour.addRequest(durationMs, isError);
  }

  getMetrics(window) {
    let metrics;
    switch (window) {
      case '5min':
        metrics = this.fiveMin;
        break;
      case '1hr':
        metrics = this.oneHour;
        break;
      case '24hr':
        metrics = this.twentyFourHour;
        break;
      default:
        metrics = this.fiveMin;
    }
    return {
      count: metrics.getCount(),
      errorCount: metrics.getErrorCount(),
      totalTime: metrics.getTotalTime(),
      avgTime: metrics.getAverageTime(),
      errorRate: metrics.getErrorRate(),
      ...metrics.getPercentiles(),
    };
  }
}

// Store metrics in memory (consider using Redis in production)
const endpointMetrics = new Map();

// Configuration
const MAX_TRACKED_ENDPOINTS = parsePositiveInteger(
  process.env.MONITORING_MAX_TRACKED_ENDPOINTS,
  1000
);

let lastEndpointCleanup = Date.now();

function parsePositiveInteger(val, defaultVal) {
  const parsed = parseInt(val, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultVal;
}

function normalizePathPattern(path) {
  if (!path || typeof path !== 'string') return 'unknown';
  const segments = path.split('/').map((segment) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(segment)) return ':id';
    const mongoIdRegex = /^[0-9a-f]{24}$/i;
    if (mongoIdRegex.test(segment)) return ':id';
    const numericRegex = /^\d+$/;
    if (numericRegex.test(segment)) return ':id';
    return segment;
  });
  let result = segments.join('/');
  if (result.length > 1 && result.endsWith('/')) {
    result = result.slice(0, -1);
  }
  return result;
}

function getRoutePath(req) {
  if (req.route) {
    if (typeof req.route.path === 'string') {
      return req.route.path;
    } else if (Array.isArray(req.route.path)) {
      return req.route.path.join('|');
    } else if (req.route.path instanceof RegExp) {
      return req.route.path.toString();
    }
  }
  return normalizePathPattern(req.path);
}

const RES_SEND_WRAPPED = Symbol('performanceMonitor.sendWrapped');

function isAlreadyWrapped(res) {
  return res[RES_SEND_WRAPPED] === true;
}

function markWrapped(res) {
  res[RES_SEND_WRAPPED] = true;
}

function cleanupExpiredEndpoints() {
  const now = Date.now();
  if (now - lastEndpointCleanup < 5 * 60 * 1000) return;
  lastEndpointCleanup = now;
  if (endpointMetrics.size > MAX_TRACKED_ENDPOINTS) {
    const entries = Array.from(endpointMetrics.entries());
    const excess = endpointMetrics.size - MAX_TRACKED_ENDPOINTS;
    for (let i = 0; i < excess; i++) {
      endpointMetrics.delete(entries[i][0]);
    }
  }
}

const performanceMonitor = (req, res, next) => {
  if (isAlreadyWrapped(res)) {
    return next();
  }
  markWrapped(res);

  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const routePath = getRoutePath(req);
    const baseUrl = req.baseUrl || '';
    const fullPath = `${baseUrl}${routePath}`;
    const endpoint = `${req.method} ${normalizePathPattern(fullPath)}`;

    cleanupExpiredEndpoints();

    if (!endpointMetrics.has(endpoint)) {
      endpointMetrics.set(endpoint, new EndpointMetrics());
    }
    const metrics = endpointMetrics.get(endpoint);

    const isError = statusCode >= 400;
    metrics.addRequest(duration, isError);

    if (duration > 1000) {
      logger.warn('Slow Request Detected', {
        endpoint,
        duration,
        status: statusCode,
      });

      addBreadcrumb({
        category: 'performance',
        message: `Slow request: ${endpoint} took ${duration}ms`,
        level: 'warning',
        data: { duration, endpoint, status: statusCode },
      });

      if (duration > 5000) {
        captureMessage(`Critical slow request: ${endpoint} took ${duration}ms`, 'warning', {
          tags: { type: 'performance', endpoint },
          extra: { duration, statusCode },
        });
      }
    }

    logger.http('HTTP Response', {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      userId: req.adminSession?.username || req.user?.id,
    });

    addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.path} - ${statusCode}`,
      level: statusCode >= 400 ? 'error' : 'info',
      data: { duration, statusCode, method: req.method, path: req.path },
    });

    return originalSend.call(this, data);
  };

  next();
};

const dbQueryMetrics = {
  totalQueries: 0,
  totalQueryTime: 0,
  slowQueriesCount: 0,
  queries: {},
};

const recordDbQueryMetric = (queryText, durationMs, error = null) => {
  dbQueryMetrics.totalQueries += 1;
  dbQueryMetrics.totalQueryTime += durationMs;
  if (durationMs > 100) {
    dbQueryMetrics.slowQueriesCount += 1;
  }

  const rawText = typeof queryText === 'string' ? queryText : queryText?.text || 'unknown';
  const normalizedQuery = rawText.trim().replace(/\s+/g, ' ').slice(0, 100);

  if (!dbQueryMetrics.queries[normalizedQuery]) {
    dbQueryMetrics.queries[normalizedQuery] = { count: 0, totalDuration: 0, errors: 0 };
  }
  dbQueryMetrics.queries[normalizedQuery].count += 1;
  dbQueryMetrics.queries[normalizedQuery].totalDuration += durationMs;
  if (error) {
    dbQueryMetrics.queries[normalizedQuery].errors += 1;
  }

  recordSlowQuery(queryText, durationMs, { error: error?.message });
};

const registrationsHistory = [];

const trackRegistration = () => {
  registrationsHistory.push(Date.now());
};

const getRegistrationsPerMinute = () => {
  const oneMinuteAgo = Date.now() - 60000;
  while (registrationsHistory.length > 0 && registrationsHistory[0] < oneMinuteAgo) {
    registrationsHistory.shift();
  }
  return registrationsHistory.length;
};

const getMetrics = () => {
  const result = {
    endpoints: {},
    databaseQueries: {
      totalQueries: dbQueryMetrics.totalQueries,
      avgQueryDurationMs: dbQueryMetrics.totalQueries > 0 ? dbQueryMetrics.totalQueryTime / dbQueryMetrics.totalQueries : 0,
      slowQueriesCount: dbQueryMetrics.slowQueriesCount,
      queries: dbQueryMetrics.queries,
    },
    customMetrics: {
      registrationsPerMinute: getRegistrationsPerMinute(),
    }
  };
  endpointMetrics.forEach((metrics, endpoint) => {
    result.endpoints[endpoint] = {
      '5min': metrics.getMetrics('5min'),
      '1hr': metrics.getMetrics('1hr'),
      '24hr': metrics.getMetrics('24hr'),
    };
  });
  return result;
};

const resetMetrics = () => {
  endpointMetrics.clear();
  dbQueryMetrics.totalQueries = 0;
  dbQueryMetrics.totalQueryTime = 0;
  dbQueryMetrics.slowQueriesCount = 0;
  dbQueryMetrics.queries = {};
  registrationsHistory.length = 0;
};

const checkErrorRateThreshold = (threshold = 5) => {
  let exceeded = false;
  endpointMetrics.forEach((metrics) => {
    const fiveMinMetrics = metrics.getMetrics('5min');
    if (fiveMinMetrics.errorRate > threshold) {
      exceeded = true;
    }
  });

  if (exceeded) {
    captureMessage(`Alert: Error rate exceeded ${threshold}% in last 5 minutes!`, 'error', {
      tags: { type: 'performance', alert: 'error_rate' },
    });
    logger.error('Error Rate Threshold Exceeded', { threshold, window: '5min' });
    return true;
  }
  return false;
};

function getHealthStatus() {
  const fiveMinErrors = Array.from(endpointMetrics.values()).reduce(
    (sum, m) => sum + m.fiveMin.getErrorCount(),
    0
  );
  const fiveMinTotal = Array.from(endpointMetrics.values()).reduce(
    (sum, m) => sum + m.fiveMin.getCount(),
    0
  );

  const errorRate = fiveMinTotal > 0 ? (fiveMinErrors / fiveMinTotal) * 100 : 0;

  if (errorRate > 10) return 'critical';
  if (errorRate > 5) return 'degraded';
  if (errorRate > 1) return 'warning';
  return 'healthy';
}

export {
  performanceMonitor,
  getMetrics,
  resetMetrics,
  checkErrorRateThreshold,
  getHealthStatus,
  recordDbQueryMetric,
  trackRegistration,
  getRegistrationsPerMinute,
};
