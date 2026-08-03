/**
 * Zod input-validation schemas for inline mutation routes defined
 * directly in server/index.js.
 *
 * Schemas are referenced by the `validate()` middleware that is
 * injected AFTER the route path and BEFORE auth / rate-limit
 * middleware.  Every schema uses `.strict()` so extra fields in
 * the request body are silently rejected.
 *
 * Where an existing schema already lives in `schemas/` or
 * `validators/` and is used inside a controller (e.g. forum,
 * mentorship, events) this file does NOT duplicate it — those
 * routes are skipped per the "keep existing validation" rule.
 */

import { z } from 'zod';

// ── Re-export existing schemas for routes that currently have
//    no middleware-level validation but do have a schema file ──

export {
  createStreamSchema,
  updateStreamSchema,
  streamStatusSchema,
  chatMessageSchema as addChatMessageSchema,
  createPollSchema,
  votePollSchema,
} from '../../schemas/streamSchema.js';

export { createResourceSchema, updateResourceSchema } from '../../schemas/resourceSchema.js';

// ────────────────────────────────────────────────────────────────
//  Analytics
// ────────────────────────────────────────────────────────────────
// POST /api/analytics/track
export const analyticsTrackSchema = z
  .object({
    type: z.string().min(1, 'type is required').max(100),
    path: z.string().max(500).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Database Backups
// ────────────────────────────────────────────────────────────────

// POST /api/admin/backups/manual
export const manualBackupSchema = z
  .object({
    type: z.enum(['full', 'files']).optional(),
  })
  .strict();

// POST /api/admin/backups/restore
export const restoreBackupSchema = z
  .object({
    backupKey: z.string().min(1).max(500).optional(),
    targetTime: z.string().min(1).max(100).optional(),
  })
  .strict()
  .refine((data) => data.backupKey || data.targetTime, {
    message: 'Either backupKey or targetTime must be provided',
  });

// DELETE /api/admin/backups
export const deleteBackupSchema = z
  .object({
    key: z.string().min(1, 'Backup key is required').max(500),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Student Auth
// ────────────────────────────────────────────────────────────────

// POST /api/auth/theme
export const updateThemeSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']),
  })
  .strict();

// PUT /api/auth/profile
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200).optional(),
    bio: z.string().trim().max(1000).optional(),
    socialLinks: z.record(z.string().max(1000)).optional(),
  })
  .strict();

// POST /api/auth/slack-settings
export const slackSettingsSchema = z
  .object({
    slackUserId: z.string().max(100).optional(),
    slackDmReminders: z.boolean().optional(),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Slack Integration (admin)
// ────────────────────────────────────────────────────────────────

// POST /api/admin/slack/config
export const slackConfigSchema = z
  .object({
    notify_new_events: z.boolean().optional(),
    notify_registrations: z.boolean().optional(),
    notify_announcements: z.boolean().optional(),
    webhook_url: z.string().url().max(500).optional().nullable(),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Streaming — extra schemas not in schemas/streamSchema.js
// ────────────────────────────────────────────────────────────────

// POST /api/streams/:id/ban
export const banUserSchema = z
  .object({
    user_email: z.string().email().max(200),
  })
  .strict();

// POST /api/streams/:id/mod-chat
export const addModChatMessageSchema = z
  .object({
    message: z.string().min(1).max(2000),
  })
  .strict();

// POST /api/streams/:id/questions
export const addQuestionSchema = z
  .object({
    content: z.string().min(1).max(2000),
    name: z.string().max(200).optional(),
  })
  .strict();

// PATCH /api/streams/questions/:qId/answer
export const answerQuestionSchema = z
  .object({
    answer: z.string().min(1).max(5000),
  })
  .strict();

// POST /api/streams/:id/reactions
export const addReactionSchema = z
  .object({
    emoji: z.string().min(1).max(50),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Notification Preferences
// ────────────────────────────────────────────────────────────────

// PUT /api/notifications/preferences
export const notificationPreferencesSchema = z
  .object({
    userId: z.string().max(255).optional(),
    category: z.string().min(1, 'category is required').max(200),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    in_app: z.boolean().optional(),
    sms: z.boolean().optional(),
    frequency: z.string().max(50).optional(),
    quiet_start: z.string().max(10).optional(),
    quiet_end: z.string().max(10).optional(),
    dnd: z.boolean().optional(),
  })
  .strict();

// PUT /api/notifications/preferences/bulk
export const bulkNotificationPreferencesSchema = z
  .object({
    userId: z.string().max(255).optional(),
    preferences: z
      .array(notificationPreferencesSchema)
      .min(1, 'preferences array is required and must not be empty'),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Forum (admin moderation only — user routes validated in
//  controller via schemas/forumSchema.js)
// ────────────────────────────────────────────────────────────────

// PATCH /api/admin/forum/threads/:id/moderate
export const moderateThreadSchema = z
  .object({
    status: z.enum(['approved', 'rejected', 'flagged']),
  })
  .strict();

// PATCH /api/admin/forum/replies/:replyId/moderate
export const moderateReplySchema = z
  .object({
    status: z.enum(['approved', 'rejected', 'flagged']),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Mentorship (status update only — others validated in controller
//  via schemas/mentorshipSchema.js)
// ────────────────────────────────────────────────────────────────

// PUT /api/mentorship/requests/:id/status
export const updateMentorshipStatusSchema = z
  .object({
    status: z.enum(['active', 'rejected', 'completed']),
  })
  .strict();

// ────────────────────────────────────────────────────────────────
//  Resources (moderation only — create/update use schemas from
//  schemas/resourceSchema.js re-exported above)
// ────────────────────────────────────────────────────────────────

// PATCH /api/admin/resources/:id/moderate
export const moderateResourceSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected']),
  })
  .strict();
