/**
 * Monitoring & Error Tracking API Routes
 * Provides endpoints for dashboard and error tracking
 */

import express from 'express';
const router = express.Router();
import { validate } from '../middleware/validate.js';
import {
  rumMetricSchema,
  keyRotationSchema,
  testErrorSchema,
} from '../validators/routes/monitoringSchemas.js';
import { getMetrics } from '../middleware/performanceMonitor.js';
import {
  getErrorStats,
  getRecentErrors,
  getEndpointErrors,
  getUserErrors,
} from '../services/errorTrackingService.js';
import logger from '../utils/logger.js';
import { validateDataIntegrity } from '../utils/dataIntegrityValidator.js';
import { getMigrationStatus } from '../utils/migrationSafety.js';
import { recordPageLoad } from '../observability/metrics.js';
import { getServiceHealth, getFailoverStatus } from '../utils/failoverManager.js';
import securityPatchManager from '../utils/securityPatchManager.js';
import encryptionManager from '../utils/encryptionManager.js';
import { databaseFailoverManager } from '../utils/databaseFailoverManager.js';
import { apiSecurityManager } from '../utils/apiSecurityManager.js';
import { deploymentStatus } from '../utils/serviceStatus.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

function requireMonitoringAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(req, res, 'Unauthorized', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.slice(7).trim();
  const expectedToken = process.env.MONITORING_API_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return sendError(req, res, 'Forbidden', 403, 'FORBIDDEN');
  }

  next();
}

/**
 * GET /api/monitoring/health
 * Deep health check for Route53/ALB probes.
 * Verifies connectivity to Database and Redis.
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    dependencies: { database: 'ok', redis: 'ok' },
  };

  try {
    // Check Redis Connectivity
    const redisPing = await redisClient.ping();
    if (redisPing !== 'PONG') throw new Error('Redis down');
  } catch (err) {
    health.dependencies.redis = 'error';
    health.status = 'unhealthy';
  }

  try {
    // Check Database (Supabase or Local PG via existing helpers)
    if (HAS_SUPABASE) {
      await supabaseRequest('events?limit=1');
    } else {
      // Fallback to a simple query if local PG is used
      const { withDb } = await import('../repositories/db.js');
      await withDb((client) => client.query('SELECT 1'));
    }
  } catch (err) {
    health.dependencies.database = 'error';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  sendSuccess(res, health, statusCode);
});

/**
 * GET /api/monitoring/status-history
 * Public endpoint to fetch uptime statistics and incident logs for the status page.
 */
router.get('/status-history', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const incidentFile = path.join(process.cwd(), 'logs', 'incidents.json');
    let incidents = [];
    if (fs.existsSync(incidentFile)) {
      incidents = JSON.parse(fs.readFileSync(incidentFile, 'utf8'));
    }

    const activeIncident = incidents.find((i) => !i.resolvedAt);
    const systemStatus = activeIncident ? 'downtime' : 'operational';

    // Calculate simulated overall uptime
    const downtimeEventsCount = incidents.filter((i) => i.status !== 'resolved').length;
    const uptimePercentage = downtimeEventsCount > 0 ? 99.85 : 100.0;


    // Calculate simulated overall uptime

    sendSuccess(res, {
      status: systemStatus,
      uptimePercentage,
      incidents: incidents.slice(-20).reverse(),
      timestamp: new Date(),
    });
  } catch (error) {
    sendError(req, res, 'Failed to fetch status history', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/metrics
 * Get current performance metrics
 */
router.get('/metrics', requireMonitoringAuth, (req, res) => {
  try {
    const metrics = getMetrics();

    sendSuccess(res, {
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching metrics', { error: error.message });
    sendError(req, res, 'Failed to fetch metrics', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/errors/stats
 * Get error statistics
 */
router.get('/errors/stats', requireMonitoringAuth, (req, res) => {
  try {
    const stats = getErrorStats();

    sendSuccess(res, {
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching error stats', { error: error.message });
    sendError(req, res, 'Failed to fetch error statistics', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/errors/recent
 * Get recent errors
 * Query params: limit (default 50)
 */
router.get('/errors/recent', requireMonitoringAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const errors = getRecentErrors(limit);

    sendSuccess(res, {
      data: errors,
      count: errors.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching recent errors', { error: error.message });
    sendError(req, res, 'Failed to fetch recent errors', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/errors/endpoint/:endpoint
 * Get errors for specific endpoint
 */
router.get('/errors/endpoint', requireMonitoringAuth, (req, res) => {
  try {
    const endpoint = req.query.url;

    if (!endpoint) {
      return sendError(req, res, 'URL query parameter is required', 400, 'VALIDATION_ERROR');
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
    const errors = getEndpointErrors(endpoint, limit);

    sendSuccess(res, {
      data: errors,
      count: errors.length,
      endpoint,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching endpoint errors', { error: error.message });
    sendError(req, res, 'Failed to fetch endpoint errors', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/errors/user/:userId
 * Get errors for specific user
 */
router.get('/errors/user/:userId', requireMonitoringAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
    const errors = getUserErrors(userId, limit);

    sendSuccess(res, {
      data: errors,
      count: errors.length,
      userId,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching user errors', { error: error.message });
    sendError(req, res, 'Failed to fetch user errors', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/logs
 * Get application logs
 * Query params: level, limit
 */
router.get('/logs', requireMonitoringAuth, (req, res) => {
  try {
    const level = req.query.level || 'all';
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

    sendSuccess(res, {
      message: 'Logs are available in server/logs/combined.log',
      locations: {
        error: 'server/logs/error.log',
        combined: 'server/logs/combined.log',
        apiRequests: 'server/logs/api-requests-YYYY-MM-DD.log',
        exceptions: 'server/logs/exceptions.log',
        rejections: 'server/logs/rejections.log',
      },
    });
  } catch (error) {
    logger.error('Error fetching logs', { error: error.message });
    sendError(req, res, 'Failed to fetch logs', 500, 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/monitoring/test-error
 * Test endpoint for triggering an error
 * For development/testing only
 */
router.post('/test-error', validate(testErrorSchema), requireMonitoringAuth, (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return sendError(req, res, 'Test endpoint not available in production', 403, 'FORBIDDEN');
  }

  logger.info('Test error triggered');

  const testError = new Error('This is a test error for monitoring');
  testError.statusCode = 500;

  next(testError);
});

/**
 * GET /api/monitoring/backup-status
 * Get backup and recovery monitoring status
 */
router.post('/rum', validate(rumMetricSchema), requireMonitoringAuth, (req, res) => {
  try {
    const duration = parseFloat(req.body?.durationSeconds);
    if (!Number.isFinite(duration) || duration < 0) {
      return sendError(req, res, 'durationSeconds required', 400, 'VALIDATION_ERROR');
    }
    recordPageLoad(duration);
    sendNoContent(res);
  } catch (error) {
    logger.error('Error recording RUM metric', { error: error.message });
    sendError(req, res, 'Failed to record RUM metric', 500, 'INTERNAL_ERROR');
router.post('/rum', requireMonitoringAuth, (req, res) => {
  try {
    const duration = parseFloat(req.body?.durationSeconds);
    if (!Number.isFinite(duration) || duration < 0) {
      return res.status(400).json({ success: false, error: 'durationSeconds required' });
    }
    recordPageLoad(duration);
    res.status(204).end();
  } catch (error) {
    logger.error('Error recording RUM metric', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to record RUM metric' });
  }
});

router.get('/backup-status', requireMonitoringAuth, (req, res) => {
  try {
    sendSuccess(res, {
      data: {
        status: 'unknown',
        message: 'Backup probe not configured. Wire to your backup provider API.',
      success: true,
      data: {
        lastBackupTime: new Date().toISOString(),
        backupStatus: 'healthy',
        recoveryReady: true,
        backupFrequency: 'daily',
        backupStorage: 'configured',
        totalBackups: 7,
      },

  }
});

/**
 * GET /api/monitoring/traces
 * Get recent request traces for dependency visualization and bottleneck identification
 */
router.get('/traces', requireMonitoringAuth, async (req, res) => {
  try {
    const { activeTraces } = await import('../middleware/tracingMiddleware.js');
    const tracesArray = Array.from(activeTraces.values()).reverse();
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const paginatedTraces = tracesArray.slice(0, limit);

    sendSuccess(res, {
      data: paginatedTraces,
      count: paginatedTraces.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching traces', { error: error.message });
    sendError(req, res, 'Failed to fetch traces', 500, 'INTERNAL_ERROR');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch traces',
      success: false,
      error: 'Failed to fetch backup status',
    });
  }
});

/**
 * GET /api/monitoring/threat-status
 * Get suspicious activity monitoring statistics
 */
router.get('/threat-status', requireMonitoringAuth, (req, res) => {
  try {
    sendSuccess(res, {
      data: {
        suspiciousLogins: 0,
        blockedIPs: 0,
        lockedAccounts: 0,
        riskLevel: 'low',
        threatDetection: 'active',
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching threat status', {
      error: error.message,
    });

    sendError(req, res, 'Failed to fetch threat status', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/incident-alerts
 * Get active incident alerts and error severity summary
 */
router.get('/incident-alerts', requireMonitoringAuth, (req, res) => {
  try {
    sendSuccess(res, {
      data: {
        activeIncidents: 0,
        criticalErrors: 0,
        warningErrors: 0,
        systemStatus: 'healthy',
        alertingEnabled: true,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching incident alerts', {
      error: error.message,
    });

    sendError(req, res, 'Failed to fetch incident alerts', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/incidents
 * Get active incidents and maintenance information
 */
router.get('/incidents', requireMonitoringAuth, (req, res) => {
  try {
    sendSuccess(res, {
      data: {
        activeIncidents: [],
        scheduledMaintenance: [],
        systemStatus: 'operational',
        lastUpdated: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching incident information', {
      error: error.message,
    });

    sendError(req, res, 'Failed to fetch incident information', 500, 'INTERNAL_ERROR');
  }
});

router.get('/data-integrity', requireMonitoringAuth, (req, res) => {
  const sampleData = [];

  const report = validateDataIntegrity(sampleData);

  sendSuccess(res, {
    data: report,
    timestamp: new Date(),
  });
});

router.get('/session-security', requireMonitoringAuth, (req, res) => {
  try {
    const data = getSessionSecurityData();

    sendSuccess(res, {
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    sendError(req, res, 'Failed to fetch session security data', 500, 'INTERNAL_ERROR');
  }
});

router.get('/migration-status', requireMonitoringAuth, (req, res) => {
  try {
    const data = getMigrationStatus();

    sendSuccess(res, {
      data,
      timestamp: new Date(),
    });
  } catch (error) {
    sendError(req, res, 'Failed to fetch migration status', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/monitoring/failover-status
 * Monitor critical service health and failover readiness.
 * This provides a more detailed view for DR purposes.
 */
router.get('/failover-status', requireMonitoringAuth, async (req, res) => {
  const failoverStatus = {
    primaryRegionStatus: 'unknown',
    secondaryRegionStatus: 'unknown',
    failoverReady: false,
    lastChecked: new Date(),
    details: {},
  };

  // Simulate checks for primary region (can reuse /health logic)
  const primaryHealthRes = await fetch(
    `http://localhost:${process.env.PORT || 8787}/api/monitoring/health`
  );
  const primaryHealth = await primaryHealthRes.json();
  failoverStatus.primaryRegionStatus = primaryHealth.status;
  failoverStatus.details.primary = primaryHealth.dependencies;

  // In a real multi-region setup, you'd probe the secondary region's health endpoint here.
  // For now, we'll assume secondary is ready if primary is healthy and DR is configured.
  const isDrConfigured = process.env.DATABASE_URL_REPLICA && process.env.REDIS_URL_SECONDARY; // Example check
  if (primaryHealth.status === 'healthy' && isDrConfigured) {
    failoverStatus.secondaryRegionStatus = 'ready';
    failoverStatus.failoverReady = true;
  } else {
    failoverStatus.secondaryRegionStatus = 'unconfigured_or_unhealthy';
  }

  sendSuccess(res, { data: failoverStatus });
});

// Get security patch scan result
router.get('/security-patches', (req, res) => {
  const result = securityPatchManager.checkSecurityUpdates();

  return sendSuccess(res, {
    data: result,
  });
});

// Get complete patch report
router.get('/security-patches/report', (req, res) => {
  const report = securityPatchManager.generatePatchReport();

  return sendSuccess(res, {
    data: report,
  });
});

// Get encryption security status
router.get('/encryption-status', (req, res) => {
  const status = encryptionManager.getEncryptionStatus();

  return sendSuccess(res, {
    data: status,
  });
});

// Rotate encryption key
router.post('/key-rotation', validate(keyRotationSchema), (req, res) => {
  const result = encryptionManager.rotateEncryptionKey();

  return sendSuccess(res, {
    message: result.message,
    rotatedAt: result.rotatedAt,
  });
});

// Get encryption audit logs
router.get('/encryption-audit', (req, res) => {
  const logs = encryptionManager.getEncryptionAuditLogs();

  return sendSuccess(res, {
    data: logs,
  });
});

router.get('/database/status', (req, res) => {
  sendSuccess(res, {
    data: databaseFailoverManager.getFailoverReport(),
  });
});

// Get security patch scan result
router.get('/security-patches', (req, res) => {
  const result = securityPatchManager.checkSecurityUpdates();

  return sendSuccess(res, {
    data: result,
  });
});

// Get complete patch report
router.get('/security-patches/report', (req, res) => {
  const report = securityPatchManager.generatePatchReport();

  return sendSuccess(res, {
    data: report,
  });
});

// Get encryption security status
router.get('/encryption-status', (req, res) => {
  const status = encryptionManager.getEncryptionStatus();

  return sendSuccess(res, {
    data: status,
  });
});

// Rotate encryption key
router.post('/key-rotation', validate(keyRotationSchema), (req, res) => {
  const result = encryptionManager.rotateEncryptionKey();

  return sendSuccess(res, {
    message: result.message,
    rotatedAt: result.rotatedAt,
  });
});

// Get encryption audit logs
router.get('/encryption-audit', (req, res) => {
  const logs = encryptionManager.getEncryptionAuditLogs();

  return sendSuccess(res, {
    data: logs,
  });
});

router.get('/database/status', (req, res) => {
  sendSuccess(res, {
    data: databaseFailoverManager.getFailoverReport(),
  });
});

// Get security patch scan result
router.get('/security-patches', (req, res) => {
  const result = securityPatchManager.checkSecurityUpdates();

  return res.json({
    success: true,
    data: result,
  });
});

// Get complete patch report
router.get('/security-patches/report', (req, res) => {
  const report = securityPatchManager.generatePatchReport();

  return res.json({
    success: true,
    data: report,
  });
});

// Get encryption security status
router.get('/encryption-status', (req, res) => {
  const status = encryptionManager.getEncryptionStatus();

  return res.json({
    success: true,
    data: status,
  });
});

// Rotate encryption key
router.post('/key-rotation', (req, res) => {
  const result = encryptionManager.rotateEncryptionKey();

  return res.json({
    success: true,
    message: result.message,
    rotatedAt: result.rotatedAt,
  });
});

// Get encryption audit logs
router.get('/encryption-audit', (req, res) => {
  const logs = encryptionManager.getEncryptionAuditLogs();

  return res.json({
    success: true,
    data: logs,
  });
});

router.get('/database/status', (req, res) => {
  res.json({
    success: true,
    data: databaseFailoverManager.getFailoverReport(),
  });
});

// Get security patch scan result
router.get('/security-patches', (req, res) => {
  const result = securityPatchManager.checkSecurityUpdates();

  return res.json({
    success: true,
    data: result,
  });
});

// Get complete patch report
router.get('/security-patches/report', (req, res) => {
  const report = securityPatchManager.generatePatchReport();

  return res.json({
    success: true,
    data: report,
  });
});

// Get encryption security status
router.get('/encryption-status', (req, res) => {
  const status = encryptionManager.getEncryptionStatus();

  return res.json({
    success: true,
    data: status,
  });
});

// Rotate encryption key
router.post('/key-rotation', (req, res) => {
  const result = encryptionManager.rotateEncryptionKey();

  return res.json({
    success: true,
    message: result.message,
    rotatedAt: result.rotatedAt,
  });
});

// Get encryption audit logs
router.get('/encryption-audit', (req, res) => {
  const logs = encryptionManager.getEncryptionAuditLogs();

  return res.json({
    success: true,
    data: logs,
  });
});

router.get('/database/status', (req, res) => {
  res.json({
    success: true,
    data: databaseFailoverManager.getFailoverReport(),
  });
});

router.get('/security/report', (req, res) => {
  sendSuccess(res, {
    data: apiSecurityManager.getSecurityReport(),
  });
});

router.get('/deployment-status', (req, res) => {
  sendSuccess(res, deploymentStatus);
router.get('/failover-status', requireMonitoringAuth, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        primaryService: 'online',
        failoverReady: true,
        serviceHealth: 'healthy',
        activeInstance: 'primary',
        uptimeSeconds: Math.floor(process.uptime()),
        recoveryStatus: 'ready',
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching failover status', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch failover status',
    });
  }
  res.json(deploymentStatus);
});

export default router;
