import { Router } from 'express';
import { webhookService, WEBHOOK_EVENTS } from '../services/webhookService.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { protectedActionRateLimiter } from '../middleware/authRateLimiter.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import {
  createWebhookSchema,
  updateWebhookSchema,
} from '../validators/routes/webhooksSchemas.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/events', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    sendSuccess(res, { data: WEBHOOK_EVENTS });
  } catch (error) {
    logger.error('Error fetching webhook events', { error: error.message });
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

router.post('/', validate(createWebhookSchema), protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const webhook = await webhookService.createWebhook(req.body, req.adminSession);
    sendSuccess(res, { data: webhook }, 201);
  } catch (error) {
    const status = error.message.includes('HTTPS') || error.message.includes('event') ? 400 : 500;
    sendError(req, res, error.message, status, status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  }
});

router.get('/', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const webhooks = await webhookService.listWebhooks();
    sendSuccess(res, { data: webhooks });
  } catch (error) {
    logger.error('Error fetching webhooks', { error: error.message });
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

router.get('/:webhookId', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const webhook = await webhookService.getWebhookById(req.params.webhookId);
    sendSuccess(res, { data: webhook });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  }
});

router.put('/:webhookId', validate(updateWebhookSchema), protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const webhook = await webhookService.updateWebhook(req.params.webhookId, req.body, req.adminSession);
    sendSuccess(res, { data: webhook });
  } catch (error) {
    const status = error.message.includes('not found')
      ? 404
      : error.message.includes('HTTPS')
        ? 400
        : 500;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  }
});

router.delete('/:webhookId', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    await webhookService.deleteWebhook(req.params.webhookId);
    sendSuccess(res, { message: 'Webhook deleted successfully' });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  }
});

router.post('/:webhookId/test', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const result = await webhookService.testWebhook(req.params.webhookId);
    sendSuccess(res, { data: result });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  }
});

router.get('/:webhookId/deliveries', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const deliveries = await webhookService.getWebhookDeliveries(req.params.webhookId, {
      limit,
      offset,
    });
    sendSuccess(res, { data: deliveries });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  }
});

router.get('/:webhookId/stats', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const stats = await webhookService.getDeliveryStats(req.params.webhookId);
    sendSuccess(res, { data: stats });
  } catch (error) {
    sendError(req, res, error.message, 500, 'INTERNAL_ERROR');
  }
});

router.post('/deliveries/:deliveryId/replay', protectedActionRateLimiter, adminAuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const result = await webhookService.replayDelivery(req.params.deliveryId);
    sendSuccess(res, { data: result });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    sendError(req, res, error.message, status, status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR');
  }
});

export default router;
