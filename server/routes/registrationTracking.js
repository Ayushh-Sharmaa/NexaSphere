/**
 * Analytics Integration Example
 * Shows how to integrate analytics endpoints into existing routes
 */

import express from 'express';
import {
  registerForEvent,
  checkInUser,
  getEventMetrics,
  getRegistrationTrends,
  bulkRegister,
} from '../controllers/registrationTrackingController.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';

const router = express.Router();

router.use(requireStudentAuth);

// Event Registration Routes
router.post('/events/:eventId/register', registerForEvent);
router.post('/events/:eventId/checkin', checkInUser);
router.post('/events/:eventId/bulk-register', bulkRegister);

// Metrics Routes
router.get('/events/:eventId/metrics', getEventMetrics);
router.get('/events/:eventId/trends', getRegistrationTrends);

export default router;

/**
 * Integration Example:
 * In your main server file (index.js), add:
 *
 * import registrationTrackingRouter from './routes/registrationTracking.js';
 * app.use('/api/tracking', registrationTrackingRouter);
 *
 * Then the analytics routes become:
 * POST   /api/tracking/events/:eventId/register
 * POST   /api/tracking/events/:eventId/checkin
 * POST   /api/tracking/events/:eventId/bulk-register
 * GET    /api/tracking/events/:eventId/metrics
 * GET    /api/tracking/events/:eventId/trends
 */
