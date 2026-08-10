import express from 'express';
const router = express.Router();
import { trackEvents } from '../controllers/analytics.controller.js';

// POST route to handle batch event tracking
router.post('/event', trackEvents);

export default router;
const analyticsController = require('../controllers/analytics.controller');
router.post('/event', analyticsController.trackEvents);

// POST route to handle batch event tracking
router.post('/event', trackEvents);

