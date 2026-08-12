import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import {
  createAnnouncementSchema,
  updatePriorityBodySchema,
  updatePriorityParamsSchema,
  pinAnnouncementBodySchema,
  pinAnnouncementParamsSchema,
  markReadBodySchema,
  markReadParamsSchema,
} from '../validators/routes/announcementPrioritySchemas.js';
import * as announcementPriorityController from '../controllers/announcementPriorityController.js';

const router = Router();

// Get all announcements
router.get('/', announcementPriorityController.getAnnouncements);

// Create a new announcement (admin only)
router.post(
  "/",
  adminAuthMiddleware.requireAdmin,
  validate(createAnnouncementSchema),
  announcementPriorityController.createAnnouncement
);

// Update announcement priority (admin only)
router.patch(
  "/:id/priority",
  adminAuthMiddleware.requireAdmin,
  validate(updatePriorityParamsSchema, "params"),
  validate(updatePriorityBodySchema),
  announcementPriorityController.updatePriority
);

// Pin or unpin an announcement (admin only)
router.patch(
  "/:id/pin",
  adminAuthMiddleware.requireAdmin,
  validate(pinAnnouncementParamsSchema, "params"),
  validate(pinAnnouncementBodySchema),
  announcementPriorityController.pinAnnouncement
);

// Mark announcement as read
router.post(
  '/:id/read',
  validate(markReadParamsSchema, 'params'),
  validate(markReadBodySchema),
  announcementPriorityController.markRead
);

// Get analytics (admin only)
router.get(
  "/analytics",
  adminAuthMiddleware.requireAdmin,
  announcementPriorityController.analytics
);

export default router;
