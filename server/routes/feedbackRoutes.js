import express from 'express';
import {
  submitFeedback,
  getFeedbackAnalytics,
  getFeedbacks,
  createActionItem,
  getActionItems,
} from '../controllers/feedbackController.js';
import { validate } from '../middleware/validate.js';
import {
  submitFeedbackSchema,
  createActionItemSchema,
} from '../validators/routes/feedbackRoutesSchemas.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';

const router = express.Router();

router.use(requireStudentAuth);

router.post('/', validate(submitFeedbackSchema), submitFeedback);
router.get('/analytics/:eventId', getFeedbackAnalytics);
router.get('/:eventId', getFeedbacks);

router.post('/actions', validate(createActionItemSchema), createActionItem);
router.get('/actions/:eventId', getActionItems);

export default router;
