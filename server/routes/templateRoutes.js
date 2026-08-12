import express from 'express';
import { getTemplates, createTemplate, cloneTemplate } from '../controllers/templateController.js';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

router.get('/', getTemplates);
router.post('/', requireAdmin, createTemplate);
router.post('/:id/clone', requireAdmin, cloneTemplate);

export default router;
