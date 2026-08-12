import { Router } from 'express';
import multer from 'multer';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { bulkOperationsService } from '../services/bulkOperationsService.js';
import {
  bulkUsersPreviewSchema,
  bulkUsersImportSchema,
  bulkUsersRoleSchema,
  bulkUsersStatusSchema,
  bulkUsersTagsSchema,
  bulkUsersEmailSchema,
  bulkEventsPreviewSchema,
  bulkEventsImportSchema,
  bulkEventsStatusSchema,
  bulkEventsCloneSchema,
  bulkEventsRemindSchema,
} from '../validators/routes/bulkSchemas.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

const router = Router();
router.use(apiRateLimiter);
const adminAuth = [adminAuthMiddleware.requireAdmin];

// Helper to support both mounted and unmounted path prefix styles
const paths = (subPath) => [`${subPath}`, `/api/admin${subPath}`];

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

// ---------------------------------------------------------------------------
// Job Management
// ---------------------------------------------------------------------------
router.get(paths('/bulk/jobs/:id'), adminAuth, (req, res) => {
  const job = bulkOperationsService.getJob(req.params.id);
  if (!job) {
    return sendError(req, res, 'Job not found', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, job);
});

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------
router.post(
  paths('/bulk/users/preview'),
  validate(bulkUsersPreviewSchema),
  adminAuth,
  (req, res) => {
    const { csv } = req.body;
    if (!csv) {
      return sendError(req, res, 'CSV data is required', 400, 'VALIDATION_ERROR');
    }
    const result = bulkOperationsService.previewImportUsers(csv);
    return sendSuccess(res, result);
  }
);

router.post(
  paths('/bulk/users/import'),
  validate(bulkUsersImportSchema),
  adminAuth,
  async (req, res) => {
    const { csv } = req.body;
    if (!csv) {
      return sendError(req, res, 'CSV data is required', 400, 'VALIDATION_ERROR');
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.importUsers(csv, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(paths('/bulk/users/upload'), adminAuth, bulkUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return sendError(req, res, 'CSV file is required', 400, 'VALIDATION_ERROR');
  }
  const csv = req.file.buffer.toString('utf-8');
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.importUsers(csv, adminId);
  return sendSuccess(res, job, 202);
});

router.get(paths('/bulk/users/export'), adminAuth, async (req, res) => {
  const { fields, role, status, major, year } = req.query;
  const selectedFields = fields ? fields.split(',') : null;
  const csv = await bulkOperationsService.exportUsers(selectedFields, {
    role,
    status,
    major,
    year,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
  return res.send(csv);
});

router.post(
  paths('/bulk/users/role'),
  validate(bulkUsersRoleSchema),
  adminAuth,
  async (req, res) => {
    const { userIds, role } = req.body;
    if (!Array.isArray(userIds) || !role) {
      return sendError(req, res, 'userIds array and role are required', 400, 'VALIDATION_ERROR');
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkRoleAssignment(userIds, role, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(
  paths('/bulk/users/status'),
  validate(bulkUsersStatusSchema),
  adminAuth,
  async (req, res) => {
    const { userIds, status } = req.body;
    if (!Array.isArray(userIds) || !status) {
      return sendError(req, res, 'userIds array and status are required', 400, 'VALIDATION_ERROR');
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkStatusChange(userIds, status, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(
  paths('/bulk/users/tags'),
  validate(bulkUsersTagsSchema),
  adminAuth,
  async (req, res) => {
    const { userIds, tags } = req.body;
    if (!Array.isArray(userIds) || !Array.isArray(tags)) {
      return sendError(
        req,
        res,
        'userIds array and tags array are required',
        400,
        'VALIDATION_ERROR'
      );
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkTagAssignment(userIds, tags, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(
  paths('/bulk/users/email'),
  validate(bulkUsersEmailSchema),
  adminAuth,
  async (req, res) => {
    const { userIds, subject, message } = req.body;
    if (!Array.isArray(userIds) || !subject || !message) {
      return sendError(
        req,
        res,
        'userIds array, subject, and message are required',
        400,
        'VALIDATION_ERROR'
      );
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkEmail(userIds, subject, message, adminId);
    return sendSuccess(res, job, 202);
  }
);

// ---------------------------------------------------------------------------
// Event Operations
// ---------------------------------------------------------------------------
router.post(
  paths('/bulk/events/preview'),
  validate(bulkEventsPreviewSchema),
  adminAuth,
  (req, res) => {
    const { csv } = req.body;
    if (!csv) {
      return sendError(req, res, 'CSV data is required', 400, 'VALIDATION_ERROR');
    }
    const result = bulkOperationsService.previewImportEvents(csv);
    return sendSuccess(res, result);
  }
);

router.post(
  paths('/bulk/events/import'),
  validate(bulkEventsImportSchema),
  adminAuth,
  async (req, res) => {
    const { csv } = req.body;
    if (!csv) {
      return sendError(req, res, 'CSV data is required', 400, 'VALIDATION_ERROR');
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.importEvents(csv, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(
  paths('/bulk/events/upload'),
  adminAuth,
  bulkUpload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return sendError(req, res, 'CSV file is required', 400, 'VALIDATION_ERROR');
    }
    const csv = req.file.buffer.toString('utf-8');
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.importEvents(csv, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(
  paths('/bulk/events/status'),
  validate(bulkEventsStatusSchema),
  adminAuth,
  async (req, res) => {
    const { eventIds, status } = req.body;
    if (!Array.isArray(eventIds) || !status) {
      return sendError(req, res, 'eventIds array and status are required', 400, 'VALIDATION_ERROR');
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkUpdateEventStatus(eventIds, status, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.post(
  paths('/bulk/events/clone'),
  validate(bulkEventsCloneSchema),
  adminAuth,
  async (req, res) => {
    const { eventIds, offsetDays } = req.body;
    if (!Array.isArray(eventIds) || typeof offsetDays !== 'number') {
      return sendError(
        req,
        res,
        'eventIds array and numeric offsetDays are required',
        400,
        'VALIDATION_ERROR'
      );
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkEventCloning(eventIds, offsetDays, adminId);
    return sendSuccess(res, job, 202);
  }
);

router.get(paths('/bulk/events/export'), adminAuth, async (req, res) => {
  const { eventIds } = req.query;
  if (!eventIds) {
    return sendError(
      req,
      res,
      'eventIds query parameter is required (comma-separated)',
      400,
      'VALIDATION_ERROR'
    );
  }
  const ids = eventIds.split(',');
  const csv = await bulkOperationsService.exportEventData(ids);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=events_export.csv');
  return res.send(csv);
});

router.post(
  paths('/bulk/events/remind'),
  validate(bulkEventsRemindSchema),
  adminAuth,
  async (req, res) => {
    const { eventIds } = req.body;
    if (!Array.isArray(eventIds)) {
      return sendError(req, res, 'eventIds array is required', 400, 'VALIDATION_ERROR');
    }
    const adminId = req.adminSession.username;
    const job = await bulkOperationsService.bulkSendReminders(eventIds, adminId);
    return sendSuccess(res, job, 202);
  }
);

// ---------------------------------------------------------------------------
// Rollback System
// ---------------------------------------------------------------------------
router.post(paths('/bulk/rollback/:id'), adminAuth, async (req, res) => {
  const auditLogId = req.params.id;
  const adminId = req.adminSession.username;
  try {
    const result = await bulkOperationsService.rollback(auditLogId, adminId);
    return sendSuccess(res, { ...result });
  } catch (err) {
    return sendError(req, res, err.message, 400, 'VALIDATION_ERROR');
  }
});

export default router;
