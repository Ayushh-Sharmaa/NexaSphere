/**
 * reportRoutes.js
 * server/routes/reportRoutes.js
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  triggerReport,
  getArchive,
  downloadReport,
  getScheduleConfigs,
  upsertScheduleConfig,
} from '../controllers/reportController.js';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';

const router = Router();

const reportsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to reports API' },
});

router.use(reportsLimiter);
router.use(requireAdmin);

router.post('/generate', triggerReport);
router.get('/archive', getArchive);
router.get('/archive/:id/download', downloadReport);
router.get('/schedule', getScheduleConfigs);
router.post('/schedule', upsertScheduleConfig);

export default router;
