import express from 'express';
import { circuitBreakerRegistry } from '../utils/circuitBreaker.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const router = express.Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

router.get('/metrics', adminAuth, async (req, res) => {
  const metrics = circuitBreakerRegistry.getAllMetrics();
  return sendSuccess(res, { circuitBreakers: metrics });
});

router.post('/reset/:name', adminAuth, async (req, res) => {
  const { name } = req.params;
  const ok = circuitBreakerRegistry.reset(name);
  if (!ok) {
    return sendError(req, res, `No circuit breaker found: "${name}"`, 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { ok: true, message: `Circuit breaker "${name}" reset to CLOSED` });
});

router.post('/retry/:name', adminAuth, async (req, res) => {
  const { name } = req.params;
  try {
    const breaker = circuitBreakerRegistry.get(name);
    if (!breaker) {
      return sendError(req, res, `No circuit breaker found: "${name}"`, 404, 'NOT_FOUND');
    }
    const result = await breaker.manualRetry();
    return sendSuccess(res, { ok: true, state: breaker.state, result });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
      return res.status(404).json({ error: `No circuit breaker found: "${name}"` });
    }
    const result = await breaker.manualRetry();
    return res.json({ ok: true, state: breaker.state, result });
    return res.json({ ok: false, error: err.message });
});

export default router;
