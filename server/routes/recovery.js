import { Router } from 'express';
import { recoveryController } from '../controllers/recoveryController.js';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';
import { adminAuditMiddleware } from '../middleware/adminAuditMiddleware.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/authRateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  userIdParamsSchema,
  usernameParamsSchema,
  adminResetPasswordBodySchema,
  forgotPasswordBodySchema,
  resetPasswordWithTokenBodySchema,
} from '../validators/routes/recoverySchemas.js';

const router = Router();

// ── Admin Recovery Routes ────────────────────────────────────────────────────
router.post(
  '/admin/users/:id/unlock',
  validate(userIdParamsSchema, 'params'),
  requireAdmin,
  adminAuditMiddleware,
  recoveryController.unlockAccount
);

router.post(
  '/admin/users/:id/reset-password',
  validate(userIdParamsSchema, 'params'),
  validate(adminResetPasswordBodySchema),
  requireAdmin,
  adminAuditMiddleware,
  recoveryController.resetPasswordAsAdmin
);

router.delete(
  '/admin/portfolios/:username',
  validate(usernameParamsSchema, 'params'),
  requireAdmin,
  adminAuditMiddleware,
  recoveryController.deletePortfolio
);

router.post(
  '/admin/portfolios/:username/recover',
  validate(usernameParamsSchema, 'params'),
  requireAdmin,
  adminAuditMiddleware,
  recoveryController.recoverPortfolio
);

// ── Public Auth Recovery Routes ──────────────────────────────────────────────
router.post(
  '/auth/forgot-password',
  validate(forgotPasswordBodySchema),
  passwordResetRateLimiter,
  recoveryController.forgotPassword
);

router.post(
  '/auth/reset-password',
  validate(resetPasswordWithTokenBodySchema),
  passwordResetRateLimiter,
  recoveryController.resetPasswordWithToken
);

export default router;
