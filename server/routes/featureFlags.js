import { Router } from 'express';
import { featureFlagsService } from '../services/featureFlagsService.js';
import { requireAdmin } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

const router = Router();
router.use(apiRateLimiter);
const adminAuth = [requireAdmin];

// --- PUBLIC/CLIENT SDK ENDPOINTS ---

/**
 * POST /api/feature-flags/evaluate
 * Evaluates feature flags for a given context.
 */
router.post('/api/feature-flags/evaluate', apiRateLimiter, async (req, res) => {
  try {
    const { flags, context } = req.body;
    if (!Array.isArray(flags)) {
      return sendError(req, res, 'flags must be an array of strings', 400, 'VALIDATION_ERROR');
    }

    const results = {};
    for (const key of flags) {
      const flag = await featureFlagsService.getFlagByKey(key);
      if (!flag) {
        results[key] = false;
        continue;
      }

      // If flag is an A/B test, we evaluate and bucket the user
      if (flag.type === 'ab_test' && context?.userId) {
        const group = await featureFlagsService.getABTestGroup(key, context.userId);
        results[key] = group === 'variant';
      } else {
        results[key] = featureFlagsService.evaluateFlag(flag, context || {});
      }
    }

    sendSuccess(res, results);
  } catch (error) {
    logger.error('Error evaluating feature flags', { error: error.message });
    sendError(req, res, 'Failed to evaluate feature flags', 500, 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/feature-flags/ab-test/conversion
 * Tracks conversion for an A/B test group.
 */
router.post('/api/feature-flags/ab-test/conversion', apiRateLimiter, async (req, res) => {
  try {
    const { flagKey, userId } = req.body;
    if (!flagKey || !userId) {
      return sendError(req, res, 'flagKey and userId are required', 400, 'VALIDATION_ERROR');
    }

    const tracked = await featureFlagsService.trackABConversion(flagKey, userId);
    sendSuccess(res, { success: tracked });
  } catch (error) {
    logger.error('Error tracking AB conversion', { error: error.message });
    sendError(req, res, 'Failed to track conversion', 500, 'INTERNAL_ERROR');
  }
});

// --- ADMIN MANAGEMENT ENDPOINTS ---

/**
 * GET /api/admin/feature-flags
 * List all feature flags
 */
router.get('/api/admin/feature-flags', adminAuth, async (req, res) => {
  try {
    const flags = await featureFlagsService.getFlags();
    sendSuccess(res, flags);
  } catch (error) {
    logger.error('Error fetching feature flags', { error: error.message });
    sendError(req, res, 'Failed to fetch feature flags', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/admin/feature-flags/stale
 * Retrieve stale flags
 */
router.get('/api/admin/feature-flags/stale', adminAuth, async (req, res) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 30;
    const stale = await featureFlagsService.checkStaleFlags(threshold);
    sendSuccess(res, stale);
  } catch (error) {
    logger.error('Error checking stale flags', { error: error.message });
    sendError(req, res, 'Failed to fetch stale flags', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/admin/feature-flags/:key
 * Get a specific flag
 */
router.get('/api/admin/feature-flags/:key', adminAuth, async (req, res) => {
  try {
    const flag = await featureFlagsService.getFlagByKey(req.params.key);
    if (!flag) {
      return sendError(req, res, 'Feature flag not found', 404, 'NOT_FOUND');
    }
    sendSuccess(res, flag);
  } catch (error) {
    logger.error('Error fetching feature flag', { error: error.message });
    sendError(req, res, 'Failed to fetch feature flag', 500, 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag
 */
router.post('/api/admin/feature-flags', adminAuth, async (req, res) => {
  try {
    const { key, name, type } = req.body;
    if (!key || !name || !type) {
      return sendError(req, res, 'key, name, and type are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await featureFlagsService.getFlagByKey(key);
    if (existing) {
      return sendError(req, res, `Feature flag with key '${key}' already exists`, 409, 'CONFLICT');
    }

    const changedBy = req.adminUser?.username || 'admin';
    const flag = await featureFlagsService.createFlag(req.body, changedBy);
    sendSuccess(res, flag, 201);
  } catch (error) {
    logger.error('Error creating feature flag', { error: error.message });
    sendError(req, res, 'Failed to create feature flag', 500, 'INTERNAL_ERROR');
  }
});

/**
 * PUT /api/admin/feature-flags/:key
 * Update an existing feature flag
 */
router.put('/api/admin/feature-flags/:key', adminAuth, async (req, res) => {
  try {
    const key = req.params.key;
    const existing = await featureFlagsService.getFlagByKey(key);
    if (!existing) {
      return sendError(req, res, 'Feature flag not found', 404, 'NOT_FOUND');
    }

    const changedBy = req.adminUser?.username || 'admin';
    const flag = await featureFlagsService.updateFlag(key, req.body, changedBy);
    sendSuccess(res, flag);
  } catch (error) {
    logger.error('Error updating feature flag', { error: error.message });
    sendError(req, res, 'Failed to update feature flag', 500, 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/admin/feature-flags/:key/toggle
 * Toggle flag status
 */
router.post('/api/admin/feature-flags/:key/toggle', adminAuth, async (req, res) => {
  try {
    const key = req.params.key;
    const { is_active } = req.body;
    if (is_active === undefined) {
      return sendError(req, res, 'is_active is required', 400, 'VALIDATION_ERROR');
    }

    const changedBy = req.adminUser?.username || 'admin';
    const flag = await featureFlagsService.toggleFlag(key, is_active, changedBy);
    if (!flag) {
      return sendError(req, res, 'Feature flag not found', 404, 'NOT_FOUND');
    }
    sendSuccess(res, flag);
  } catch (error) {
    logger.error('Error toggling feature flag', { error: error.message });
    sendError(req, res, 'Failed to toggle feature flag', 500, 'INTERNAL_ERROR');
  }
});

/**
 * DELETE /api/admin/feature-flags/:key
 * Delete a feature flag
 */
router.delete('/api/admin/feature-flags/:key', adminAuth, async (req, res) => {
  try {
    const key = req.params.key;
    const changedBy = req.adminUser?.username || 'admin';
    const success = await featureFlagsService.deleteFlag(key, changedBy);
    if (!success) {
      return sendError(req, res, 'Feature flag not found', 404, 'NOT_FOUND');
    }
    sendSuccess(res, { success: true });
  } catch (error) {
    logger.error('Error deleting feature flag', { error: error.message });
    sendError(req, res, 'Failed to delete feature flag', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/admin/feature-flags/:key/history
 * Get change history for a flag
 */
router.get('/api/admin/feature-flags/:key/history', adminAuth, async (req, res) => {
  try {
    const history = await featureFlagsService.getFlagHistory(req.params.key);
    sendSuccess(res, history);
  } catch (error) {
    logger.error('Error fetching feature flag history', { error: error.message });
    sendError(req, res, 'Failed to fetch feature flag history', 500, 'INTERNAL_ERROR');
  }
});

/**
 * GET /api/admin/feature-flags/:key/ab-test
 * Get A/B test analytics
 */
router.get('/api/admin/feature-flags/:key/ab-test', adminAuth, async (req, res) => {
  try {
    const analytics = await featureFlagsService.getABTestAnalytics(req.params.key);
    sendSuccess(res, analytics);
  } catch (error) {
    logger.error('Error fetching AB test analytics', { error: error.message });
    sendError(req, res, 'Failed to fetch A/B test analytics', 500, 'INTERNAL_ERROR');
  }
});

/**
 * POST /api/admin/feature-flags/:key/ab-test/reset
 * Reset A/B test metrics
 */
router.post('/api/admin/feature-flags/:key/ab-test/reset', adminAuth, async (req, res) => {
  try {
    await featureFlagsService.resetABTest(req.params.key);
    sendSuccess(res, { success: true });
  } catch (error) {
    logger.error('Error resetting AB test metrics', { error: error.message });
    sendError(req, res, 'Failed to reset A/B test metrics', 500, 'INTERNAL_ERROR');
  }
});

export default router;
