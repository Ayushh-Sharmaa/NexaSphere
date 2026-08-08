/**
 * Core Team Routes
 * Public and admin endpoints for managing core team members.
 */

import { Router } from 'express';
import * as coreTeamController from '../controllers/coreTeamController.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { adminAuditMiddleware, attachOldState } from '../middleware/adminAuditMiddleware.js';
import { validate } from '../middleware/validate.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  addCoreTeamMemberSchema,
  submitApplicationSchema,
  reviewApplicationSchema,
} from '../validators/routes/coreTeamSchemas.js';

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

/**
 * GET /api/content/team â€” Public core team listing.
 * Filters out non-@glbajajgroup.org emails for privacy.
 */
router.get('/api/content/team', coreTeamController.publicListMembers);

/**
 * GET /api/admin/core-team â€” List all core team members (admin).
 */
router.get('/api/admin/core-team', adminAuth, coreTeamController.adminListCoreTeamMembers);

/**
 * POST /api/admin/core-team â€” Add a new core team member (admin).
 */
router.post(
  '/api/admin/core-team',
  apiRateLimiter,
  validate(addCoreTeamMemberSchema),
  adminAuth,
  coreTeamController.adminAddCoreTeamMember
);

/**
 * DELETE /api/admin/core-team/:id â€” Remove a core team member (admin).
 */
router.delete('/api/admin/core-team/:id', adminAuth, coreTeamController.adminDeleteCoreTeamMember);

/**
 * POST /api/core-team/apply — Student submits application to join core team.
 */
router.post(
  '/api/core-team/apply',
  validate(submitApplicationSchema),
  coreTeamController.submitApplication
);

/**
 * GET /api/admin/core-team/applications — List all pending applications (admin).
 */
router.get('/api/admin/core-team/applications', adminAuth, coreTeamController.listApplications);

/**
 * POST /api/admin/core-team/applications/:id/approve — Approve an application (admin).
 */
router.post(
  '/api/admin/core-team/applications/:id/approve',
  apiRateLimiter,
  validate(reviewApplicationSchema),
  adminAuth,
  coreTeamController.approveApplication
);

/**
 * POST /api/admin/core-team/applications/:id/reject — Reject an application (admin).
 */
router.post(
  '/api/admin/core-team/applications/:id/reject',
  apiRateLimiter,
  validate(reviewApplicationSchema),
  adminAuth,
  coreTeamController.rejectApplication
);

export default router;
