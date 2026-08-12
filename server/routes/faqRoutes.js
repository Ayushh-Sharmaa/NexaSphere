import { Router } from 'express';
import { faqController } from '../controllers/faqController.js';
import * as adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';
import { validate } from '../middleware/validate.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  createFaqSchema,
  updateFaqSchema,
  trackViewSchema,
  deleteFaqSchema,
} from '../validators/routes/faqRoutesSchemas.js';

const router = Router();

// Public endpoints
router.get('/', faqController.getFAQs);
router.post('/:id/view', validate(trackViewSchema), faqController.trackView);

// Admin endpoints
router.get('/admin', adminAuthMiddleware.requireAdmin, faqController.adminGetFAQs);
router.post(
  '/admin',
  apiRateLimiter,
  validate(createFaqSchema),
  adminAuthMiddleware.requireAdmin,
  faqController.adminCreateFAQ
);
router.put(
  '/admin/:id',
  apiRateLimiter,
  validate(updateFaqSchema),
  adminAuthMiddleware.requireAdmin,
  faqController.adminUpdateFAQ
);
router.delete(
  '/admin/:id',
  apiRateLimiter,
  validate(deleteFaqSchema),
  adminAuthMiddleware.requireAdmin,
  faqController.adminDeleteFAQ
);

export default router;
