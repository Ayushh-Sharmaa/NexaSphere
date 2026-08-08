/**
 * Portfolio Analytics Routes
 * POST /api/portfolio/:username/view  — public, records a page view
 * GET  /api/portfolio/:username/analytics — owner-only (passkey), returns stats
 */

import { Router } from 'express';
import { portfolioAnalyticsRepository } from '../repositories/portfolioAnalyticsRepository.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { validate } from '../middleware/validate.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import {
  viewParamsSchema,
  analyticsParamsSchema,
  analyticsQuerySchema,
} from '../validators/routes/portfolioAnalyticsSchemas.js';

const router = Router();

router.post(
  '/api/portfolio/:username/view',
  validate(viewParamsSchema, 'params'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '').trim();
      if (!username) {
        return sendError(req, res, 'Username is required', 400, 'VALIDATION_ERROR');
      }

      const ip = String(req.ip || 'unknown').trim();
      const referrer = req.get('Referer') || req.body?.referrer || null;

      await portfolioAnalyticsRepository.recordView(username, { ip, referrer });
      return sendNoContent(res);
    } catch (err) {
      console.error('Error recording portfolio view:', err);
      // Fail silently from the client's perspective — view tracking should
      // never break the portfolio page itself.
      return sendNoContent(res);
    }
  }
);

router.get(
  '/api/portfolio/:username/analytics',
  apiRateLimiter,
  validate(analyticsParamsSchema, 'params'),
  validate(analyticsQuerySchema, 'query'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '').trim();
      const passkey = String(req.query.passkey || '').trim();
      const days = Number(req.query.days) || 30;

      if (!username || !passkey) {
        return sendError(req, res, 'Username and passkey are required', 400, 'VALIDATION_ERROR');
      }

      const isAuthorized = await portfolioRepository.verifyPasskey(username, passkey);
      if (!isAuthorized) {
        return sendError(req, res, 'Incorrect passkey for this username', 401, 'UNAUTHORIZED');
      }

      const stats = await portfolioAnalyticsRepository.getStats(username, { days });
      return sendSuccess(res, stats);
    } catch (err) {
      console.error('Error fetching portfolio analytics:', err);
      return sendError(req, res, err.message || 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);

export default router;
