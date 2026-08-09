import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';
import * as eventConflictController from '../controllers/eventConflictController.js';

const router = Router();

/**
 * Detect conflicting events
 */
router.get('/conflicts', requireAdmin, eventConflictController.getConflicts);

/**
 * Check venue availability
 */
router.get('/venue', requireAdmin, eventConflictController.getVenueAvailability);

/**
 * Attendance impact analysis
 */
router.get('/attendance-impact', requireAdmin, eventConflictController.getAttendanceImpact);

/**
 * Smart scheduling recommendations
 */
router.get('/recommendations', requireAdmin, eventConflictController.getScheduleRecommendations);

/**
 * Calendar events
 */
router.get('/calendar', requireAdmin, eventConflictController.getCalendarEvents);

/**
 * Organizer alerts
 */
router.get('/alerts', requireAdmin, eventConflictController.getOrganizerAlerts);

export default router;
