import { Router } from 'express';
import * as userSegmentsController from '../controllers/userSegmentsController.js';
import { validate } from '../middleware/validate.js';
import {
  idParamsSchema,
  createSegmentBodySchema,
  updateSegmentBodySchema,
} from '../validators/routes/segmentsSchemas.js';

const router = Router();

router.get('/', userSegmentsController.getSegments);
router.post('/', validate(createSegmentBodySchema), userSegmentsController.createSegment);
router.get('/:id', validate(idParamsSchema, 'params'), userSegmentsController.getSegmentById);
router.put(
  '/:id',
  validate(idParamsSchema, 'params'),
  validate(updateSegmentBodySchema),
  userSegmentsController.updateSegment
);
router.delete('/:id', validate(idParamsSchema, 'params'), userSegmentsController.deleteSegment);
router.get(
  '/:id/users',
  validate(idParamsSchema, 'params'),
  userSegmentsController.getSegmentUsers
);

// Trigger auto-segmentation manually
router.post('/auto/trigger', userSegmentsController.triggerAutoSegmentation);

export default router;
