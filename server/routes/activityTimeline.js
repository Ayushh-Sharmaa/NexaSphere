import { Router } from 'express';
import * as controller from '../controllers/activityTimelineController.js';
import { validate } from '../middleware/validate.js';
import { addActivitySchema } from '../validators/routes/activityTimelineSchemas.js';

const router = Router();

router.get('/:userId', controller.getTimeline);

router.post('/:userId', validate(addActivitySchema), controller.addActivity);

router.get('/:userId/summary', controller.getSummary);

router.get('/:userId/stats', controller.getStats);

export default router;
