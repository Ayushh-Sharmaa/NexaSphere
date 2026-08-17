import { Router } from 'express';
import * as eventPricingController from '../controllers/eventPricingController.js';
import { requireScope } from '../middleware/adminAuthMiddleware.js';
import { adminAuditMiddleware } from '../middleware/adminAuditMiddleware.js';

const router = Router({ mergeParams: true });

// Mounted at /api/events/:eventId/pricing

router.get('/', eventPricingController.getTiers);
router.get('/current', eventPricingController.getCurrentPrice);

router.post(
  '/',
  requireScope('events:write'),
  eventPricingController.setTiers,
  adminAuditMiddleware
);

export default router;
