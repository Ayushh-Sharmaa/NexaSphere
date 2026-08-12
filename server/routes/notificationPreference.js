import { Router } from 'express';
import * as controller from '../controllers/notificationPreferenceController.js';

const router = Router();

router.get('/:userId', controller.getPreferences);

router.put('/:userId', controller.updatePreferences);

router.get('/:userId/history', controller.getHistory);

export default router;
