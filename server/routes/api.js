import { Router } from 'express';
import { eventsController } from '../controllers/eventsController.js';
import { activityEventsController } from '../controllers/activityEventsController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { coreTeamController } from '../controllers/coreTeamController.js';

const router = Router();

// Public
router.get('/api/content/events', eventsController.listEvents);
router.get('/api/content/activity-events/:activityKey', activityEventsController.listActivityEvents);
router.post('/api/content/activity-events/:activityKey', activityEventsController.addActivityEvent);
router.delete('/api/content/activity-events/:activityKey/:eventId', activityEventsController.deleteActivityEvent);

// Admin auth
router.post('/api/admin/login', adminAuthMiddleware.login);

router.get('/api/admin/events', adminAuthMiddleware.requireAdmin, eventsController.adminListEvents);
router.post('/api/admin/events', adminAuthMiddleware.requireAdmin, eventsController.adminCreateEvent);
router.put('/api/admin/events/:id', adminAuthMiddleware.requireAdmin, eventsController.adminUpdateEvent);
router.delete('/api/admin/events/:id', adminAuthMiddleware.requireAdmin, eventsController.adminDeleteEvent);

// Core team management APIs
router.get('/api/admin/core-team/members', adminAuthMiddleware.requireAdmin, coreTeamController.adminListCoreTeamMembers);
router.post('/api/admin/core-team/members', adminAuthMiddleware.requireAdmin, coreTeamController.adminAddCoreTeamMember);
router.delete('/api/admin/core-team/members/:id', adminAuthMiddleware.requireAdmin, coreTeamController.adminDeleteCoreTeamMember);

export default router;

