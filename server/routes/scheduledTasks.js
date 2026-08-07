/**
 * routes/scheduledTasks.js
 * REST API for Scheduled Task & Job Management (Issue #1770)
 *
 * Endpoints (all require admin auth):
 *   GET    /api/admin/scheduled-tasks          – list all tasks + stats
 *   GET    /api/admin/scheduled-tasks/stats    – aggregate stats only
 *   GET    /api/admin/scheduled-tasks/:id      – single task detail
 *   GET    /api/admin/scheduled-tasks/:id/history – execution history
 *   PATCH  /api/admin/scheduled-tasks/:id      – update enabled / cron
 *   POST   /api/admin/scheduled-tasks/:id/run  – manual trigger
 */

import { Router } from 'express';
import { schedulerService } from '../services/schedulerService.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import { updateTaskSchema, triggerTaskSchema } from '../validators/routes/scheduledTasksSchemas.js';

const router = Router();

// ─── Middleware: basic input sanitiser ───────────────────────────────────────
function sanitizeId(req, res, next) {
  const { id } = req.params;
  if (!/^[a-z0-9-]+$/.test(id)) {
    return sendError(req, res, 'Invalid task id', 400, 'VALIDATION_ERROR');
  }
  next();
}

// ─── GET /api/admin/scheduled-tasks ─────────────────────────────────────────
router.get('/', (_req, res) => {
  try {
    const tasks = schedulerService.getAllTasks();
    const stats = schedulerService.getStats();
    sendSuccess(res, { tasks, stats });
  } catch (err) {
    sendError(_req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ─── GET /api/admin/scheduled-tasks/stats ────────────────────────────────────
router.get('/stats', (_req, res) => {
  try {
    sendSuccess(res, schedulerService.getStats());
  } catch (err) {
    sendError(_req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ─── GET /api/admin/scheduled-tasks/:id ──────────────────────────────────────
router.get('/:id', sanitizeId, (req, res) => {
  try {
    const task = schedulerService.getTask(req.params.id);
    if (!task) return sendError(req, res, 'Task not found', 404, 'NOT_FOUND');
    sendSuccess(res, task);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ─── GET /api/admin/scheduled-tasks/:id/history ──────────────────────────────
router.get('/:id/history', sanitizeId, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const history = schedulerService.getHistory(req.params.id, limit);
    sendSuccess(res, { history });
  } catch (err) {
    if (err.message.includes('not found'))
      return sendError(req, res, err.message, 404, 'NOT_FOUND');
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ─── PATCH /api/admin/scheduled-tasks/:id ────────────────────────────────────
router.patch('/:id', validate(updateTaskSchema), sanitizeId, (req, res) => {
  try {
    const { enabled, cron } = req.body;
    let task = schedulerService.getTask(req.params.id);
    if (!task) return sendError(req, res, 'Task not found', 404, 'NOT_FOUND');

    if (typeof enabled === 'boolean') {
      task = schedulerService.setEnabled(req.params.id, enabled);
    }

    if (typeof cron === 'string') {
      task = schedulerService.setCron(req.params.id, cron);
    }

    sendSuccess(res, task);
  } catch (err) {
    if (err.message.includes('not found'))
      return sendError(req, res, err.message, 404, 'NOT_FOUND');
    if (err.message.toLowerCase().includes('invalid cron')) {
      return sendError(req, res, err.message, 400, 'VALIDATION_ERROR');
    }
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

// ─── POST /api/admin/scheduled-tasks/:id/run ─────────────────────────────────
router.post('/:id/run', validate(triggerTaskSchema), sanitizeId, async (req, res) => {
  try {
    const task = await schedulerService.triggerNow(req.params.id);
    sendSuccess(res, { message: 'Task executed successfully', task });
  } catch (err) {
    if (err.message.includes('not found'))
      return sendError(req, res, err.message, 404, 'NOT_FOUND');
    if (err.message.includes('already running'))
      return sendError(req, res, err.message, 409, 'CONFLICT');
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
});

export default router;
