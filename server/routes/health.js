/**
 * Health Check Routes
 * Provides liveness probes for load balancers, monitoring services,
 * and deep health checks that verify database connectivity.
 */

import { Router } from 'express';
import { eventsService } from '../services/eventsService.js';
import { HAS_SUPABASE } from '../storage/supabaseClient.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               timestamp: "2026-07-14T10:00:00.000Z"
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    service: 'nexasphere-api',
    timestamp: new Date().toISOString(),
  });
  sendSuccess(res, {
    status: 'ok',
    service: 'nexasphere-api',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health — Alias for /health used by platform-level monitors.
 */
router.get('/api/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'nexasphere-api',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /healthz — Deep health check that verifies the events service
 * is reachable and reports the active storage backend.
 * Returns 503 if the service is unhealthy.
 */
router.get('/healthz', async (_req, res) => {
  try {
    const list = await eventsService.listEvents({ page: 1, limit: 1 });
    sendSuccess(res, {
      ok: true,
      events: list?.total ?? 0,
      storage: HAS_SUPABASE ? 'supabase' : 'file',
    });
  } catch (e) {
    sendError(req, res, e?.message || 'Health check failed', 503, 'DEPENDENCY_ERROR', {
      storage: HAS_SUPABASE ? 'supabase' : 'file',
    });
  }
});

export default router;
