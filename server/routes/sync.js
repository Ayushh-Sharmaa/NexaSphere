import { Router } from 'express';
import { syncController } from '../controllers/syncController.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { apiRateLimiter, syncRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { syncBatchSchema, resolveConflictsSchema } from '../validators/routes/syncSchemas.js';

const router = Router();

router.get('/api/sync/status', apiRateLimiter, requireStudentAuth, syncController.getSyncStatus);
router.get('/api/sync/updates', requireStudentAuth, syncController.getUpdates);
router.post(
  '/api/sync/batch',
  validate(syncBatchSchema),
  requireStudentAuth,
  syncRateLimiter,
  syncController.syncBatch
);
router.post(
  '/api/sync/resolve-conflicts',
  validate(resolveConflictsSchema),
  requireStudentAuth,
  syncRateLimiter,
  syncController.resolveConflicts
);


router.get('/api/sync/status', syncController.getSyncStatus);
router.get('/api/sync/updates', syncController.getUpdates);
router.post('/api/sync/batch', syncController.syncBatch);

export default router;
