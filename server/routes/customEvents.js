import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  createEventDefinition,
  listEventDefinitions,
  getEventDefinition,
  updateEventDefinition,
  deleteEventDefinition,
  logCustomEvent,
  getEventAnalytics,
  getRecentLogs,
  exportEventData,
} from '../controllers/customEventController.js';

const router = Router();
const adminAuth = [apiRateLimiter, requireAdmin];

// Event Definitions (no-code creation)
router.get('/definitions', adminAuth, listEventDefinitions);
router.post('/definitions', adminAuth, createEventDefinition);
router.get('/definitions/:id', adminAuth, getEventDefinition);
router.patch('/definitions/:id', adminAuth, updateEventDefinition);
router.delete('/definitions/:id', adminAuth, deleteEventDefinition);

// Event Logging (can be called from client apps with session context)
router.post('/log', adminAuth, logCustomEvent);

// Analytics Dashboard per event
router.get('/definitions/:id/analytics', adminAuth, getEventAnalytics);
router.get('/definitions/:id/logs', adminAuth, getRecentLogs);

// Export
router.get('/definitions/:id/export', adminAuth, exportEventData);

export default router;
