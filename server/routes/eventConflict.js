import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import * as eventConflictController from '../controllers/eventConflictController.js';

const router = Router();

/**
 * Detect conflicting events
 */
router.get('/conflicts', adminAuthMiddleware.requireAdmin, eventConflictController.getConflicts);
router.get('/conflicts', adminAuthMiddleware.requireAdmin, eventConflictController.getConflicts);

/**
 * Check venue availability
 * Example:
 * /venue?venue=Auditorium&date=2026-07-15
 */
router.get(
  '/venue',
  adminAuthMiddleware.requireAdmin,
  eventConflictController.getVenueAvailability
);

/**
 * Attendance impact analysis
 */
router.get(
  '/attendance-impact',
  adminAuthMiddleware.requireAdmin,
  eventConflictController.getAttendanceImpact
);

/**
 * Smart scheduling recommendations
 */
router.get(
  '/recommendations',
  adminAuthMiddleware.requireAdmin,
  eventConflictController.getScheduleRecommendations
);

/**
 * Calendar events
 */
router.get(
  '/calendar',
  adminAuthMiddleware.requireAdmin,
  eventConflictController.getCalendarEvents
);

/**
 * Organizer alerts
 */
router.get('/alerts', adminAuthMiddleware.requireAdmin, eventConflictController.getOrganizerAlerts);

export default router;
router.get('/alerts', adminAuthMiddleware.requireAdmin, eventConflictController.getOrganizerAlerts);
export default router;
