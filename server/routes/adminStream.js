/**
 * Admin SSE Stream Routes
 * Real-time updates for admin dashboard
 */

import express from 'express';
import {
  addSSEClient,
  setupSSEHeaders,
  getConnectedSSEClientsCount,
} from '../services/sseService.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const router = express.Router();
router.use(apiRateLimiter);
const requireAdmin = [adminAuthMiddleware.requireAdmin];

/**
 * SSE stream endpoint - real-time updates for admin
 * GET /api/admin/stream
 * Requires valid admin session token
 */
router.get('/stream', requireAdmin, (req, res) => {
  const adminId = req.adminSession?.username;
  if (!adminId) {
    return sendError(req, res, 'Unauthorized', 401, 'UNAUTHORIZED');
  }
router.get('/stream', setupSSEHeaders, (req, res) => {
  const adminId = req.adminSession?.username || 'anonymous';
  logger.info('Admin connected to SSE stream', { adminId });

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    res.adminSessionToken = authHeader.slice(7).trim();
  }

  logger.info('Admin connected to SSE stream', { adminId });
  addSSEClient(res, req.adminSession);

  // Guard against writing to an already-ended response (e.g. max capacity reached)
  if (res.writableEnded) return;

  // Initialize headers and hand off the response to the SSE service
  setupSSEHeaders(req, res, () => {
    addSSEClient(res);
  });
});

/**
 * Get connected clients count
 * GET /api/admin/stream/info
 */
router.get('/stream/info', requireAdmin, (req, res) => {
  try {
    sendSuccess(res, {
      connectedClients: getConnectedSSEClientsCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting stream info', { error: error.message });
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

/**
 * Emergency Alert Status Endpoint
 * GET /api/admin/emergency-alert
 *
 * Returns current emergency alert information
 * for the admin dashboard.
 */
router.get('/emergency-alert', requireAdmin, (req, res) => {
  try {
    sendSuccess(res, {
      alertActive: false,
      priority: 'HIGH',
      message: 'No active emergency alerts',
      connectedClients: getConnectedSSEClientsCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching emergency alert status', {
      error: error.message,
    });

    sendError(req, res, 'Failed to fetch emergency alert status', 500, 'INTERNAL_ERROR');
  }
});

/**
 * Emergency Alert Status Endpoint
 * GET /api/admin/emergency-alert
 *
 * Returns current emergency alert information
 * for the admin dashboard.
 */
router.get('/emergency-alert', requireAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      alertActive: false,
      priority: 'HIGH',
      message: 'No active emergency alerts',
      connectedClients: getConnectedSSEClientsCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching emergency alert status', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency alert status',
    });
  }
});

});
export default router;
