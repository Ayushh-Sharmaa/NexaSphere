import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  joinWaitlistSchema,
  autoEnrollSchema,
  setDeadlineSchema,
} from '../validators/routes/waitlistSchemas.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import * as waitlistController from '../controllers/waitlistController.js';

const router = Router();

/**
 * Join waitlist
 */
router.post(
  '/join',
  validate(joinWaitlistSchema),
  adminAuthMiddleware.requireAdmin,
  waitlistController.joinWaitlist
);
router.post('/join', adminAuthMiddleware.requireAdmin, waitlistController.joinWaitlist);
  adminAuthMiddleware.requireAdmin,
  waitlistController.joinWaitlist

/**
 * Get user's waitlist position
 * Example:
 * /position?eventId=123&userId=456
 */
router.get('/position', adminAuthMiddleware.requireAdmin, waitlistController.getPosition);
router.get('/position', adminAuthMiddleware.requireAdmin, waitlistController.getPosition);

/**
 * Auto-enroll next user
 */
router.post(
  '/auto-enroll',
  validate(autoEnrollSchema),
  adminAuthMiddleware.requireAdmin,
  waitlistController.autoEnroll
);
router.post('/auto-enroll', adminAuthMiddleware.requireAdmin, waitlistController.autoEnroll);
  adminAuthMiddleware.requireAdmin,
  waitlistController.autoEnroll

/**
 * Get notification list
 */
router.get('/notifications', adminAuthMiddleware.requireAdmin, waitlistController.getNotifications);
router.get('/notifications', adminAuthMiddleware.requireAdmin, waitlistController.getNotifications);

/**
 * Waitlist analytics
 */
router.get('/analytics', adminAuthMiddleware.requireAdmin, waitlistController.getAnalytics);
router.get('/analytics', adminAuthMiddleware.requireAdmin, waitlistController.getAnalytics);

/**
 * Set registration deadline
 */
router.post(
  '/deadline',
  validate(setDeadlineSchema),
  adminAuthMiddleware.requireAdmin,
  waitlistController.setDeadline
);

/**
 * Get waitlist for a specific event
 */
router.get(
  '/event/:eventId',
  adminAuthMiddleware.requireAdmin,
  waitlistController.getWaitlistForEvent
);

/**
 * Manually promote a waitlisted user
 */
router.post(
  '/event/:eventId/promote',
  adminAuthMiddleware.requireAdmin,
  waitlistController.manuallyPromote
);

export default router;
router.post('/deadline', adminAuthMiddleware.requireAdmin, waitlistController.setDeadline);
