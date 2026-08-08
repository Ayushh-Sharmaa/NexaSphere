import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { projectHealthController } from '../controllers/projectHealthController.js';

const router = Router();
const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

/**
 * GET /api/admin/project-health
 * Single-call summary of events, core team, and forum moderation load,
 * for the admin "Project Health" overview page.
 */
router.get('/project-health', adminAuth, projectHealthController.getOverview);

export default router;
