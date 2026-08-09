import express from 'express';
import {
  upsertPricing,
  getPricing,
  getPriceTransparency,
  recalculatePrice,
  setAdminOverride,
  getAnalytics,
} from '../controllers/dynamicPricingController.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';

const router = express.Router();

router.get('/:eventId', getPricing);
router.get('/transparency/:eventId', getPriceTransparency);
router.post('/config/:eventId', requireStudentAuth, upsertPricing);
router.post('/recalculate/:eventId', requireStudentAuth, recalculatePrice);
router.post('/override/:eventId', requireStudentAuth, setAdminOverride);
router.get('/analytics/all', requireStudentAuth, getAnalytics);

export default router;
