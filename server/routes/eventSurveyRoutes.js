import { Router } from 'express';
import * as eventSurveyController from '../controllers/eventSurveyController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { adminAuditMiddleware } from '../middleware/adminAuditMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });

// Mounted at /api/events/:eventId/survey

router.get('/template', eventSurveyController.getTemplate);

router.post(
  '/template',
  adminAuthMiddleware.requireScope('events:write'),
  eventSurveyController.setTemplate,
  adminAuditMiddleware
);

router.post('/responses', authMiddleware.requireUser, eventSurveyController.submitResponse);

router.get(
  '/analytics',
  adminAuthMiddleware.requireScope('events:read'),
  eventSurveyController.getAnalytics
);

export default router;
