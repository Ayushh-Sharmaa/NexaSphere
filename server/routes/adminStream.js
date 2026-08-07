/**
 * Admin SSE Stream Routes
 * Real-time updates for admin dashboard
 */

import express from "express";
import {
  addSSEClient,
  setupSSEHeaders,
  getConnectedSSEClientsCount,
} from "../services/sseService.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";
import logger from "../utils/logger.js";

const router = express.Router();
const requireAdmin = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

/**
 * SSE stream endpoint - real-time updates for admin
 * GET /api/admin/stream
 * Requires valid admin session token
 */
router.get("/stream", requireAdmin, (req, res) => {
  const adminId = req.adminSession?.username;
  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  logger.info("Admin connected to SSE stream", { adminId });
  addSSEClient(res, req.adminSession);

  // Initialize headers and hand off the response to the SSE service
  setupSSEHeaders(req, res, () => {
    addSSEClient(res);
  });
});

/**
 * Get connected clients count
 * GET /api/admin/stream/info
 */
router.get("/stream/info", requireAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      connectedClients: getConnectedSSEClientsCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting stream info", { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Emergency Alert Status Endpoint
 * GET /api/admin/emergency-alert
 *
 * Returns current emergency alert information
 * for the admin dashboard.
 */
router.get("/emergency-alert", requireAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      alertActive: false,
      priority: "HIGH",
      message: "No active emergency alerts",
      connectedClients: getConnectedSSEClientsCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching emergency alert status", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Failed to fetch emergency alert status",
    });
  }
});

export default router;
