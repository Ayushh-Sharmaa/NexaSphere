/**
 * Core Team Routes
 * Public and admin endpoints for managing core team members.
 */

import { Router } from 'express';
import * as coreTeamController from '../controllers/coreTeamController.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { adminAuditMiddleware, attachOldState } from '../middleware/adminAuditMiddleware.js';
import { validate } from '../middleware/validate.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  addCoreTeamMemberSchema,
  submitApplicationSchema,
  reviewApplicationSchema,
} from '../validators/routes/coreTeamSchemas.js';

const router = Router();

/**
 * GET /api/content/team — Public core team listing.
 * Filters out non-@glbajajgroup.org emails for privacy.
 */
router.get('/api/content/team', coreTeamController.publicListMembers);

/**
 * GET /api/admin/core-team — List all core team members (admin).
 */
router.get('/api/admin/core-team', requireAdmin, coreTeamController.adminListCoreTeamMembers);

/**
 * POST /api/admin/core-team — Add a new core team member (admin).
 */
router.post(
  '/api/admin/core-team',
  apiRateLimiter,
  validate(addCoreTeamMemberSchema),
  requireAdmin,
  coreTeamController.adminAddCoreTeamMember
);

/**
 * DELETE /api/admin/core-team/:id — Remove a core team member (admin).
 */
router.delete('/api/admin/core-team/:id', requireAdmin, coreTeamController.adminDeleteCoreTeamMember);

/**
 * POST /api/core-team/apply — Student submits application to join core team.
 */
router.post(
  '/api/core-team/apply',
  requireStudentAuth,
  validate(submitApplicationSchema),
  coreTeamController.submitApplication
);

/**
 * GET /api/admin/core-team/applications — List all pending applications (admin).
 */
router.get('/api/admin/core-team/applications', requireAdmin, coreTeamController.listApplications);

/**
 * POST /api/admin/core-team/applications/:id/approve — Approve an application (admin).
 */
router.post(
  '/api/admin/core-team/applications/:id/approve',
  apiRateLimiter,
  validate(reviewApplicationSchema),
  requireAdmin,
  coreTeamController.approveApplication
);

/**
 * POST /api/admin/core-team/applications/:id/reject — Reject an application (admin).
 */
router.post(
  '/api/admin/core-team/applications/:id/reject',
  apiRateLimiter,
  validate(reviewApplicationSchema),
  requireAdmin,
  coreTeamController.rejectApplication
);

export default router;
