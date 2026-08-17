import { Router } from 'express';
import { globalSearch } from '../controllers/adminSearchController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = Router();
router.get('/', adminAuthMiddleware.requireAdmin, globalSearch);

export default router;
