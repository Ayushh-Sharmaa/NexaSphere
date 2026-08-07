import { z } from 'zod';

/**
 * Schema for POST /ai-check — AI content moderation check.
 */
export const aiCheckSchema = z
  .object({
    content: z.string().trim().min(1, 'content string is required'),
  })
  .strict();

/**
 * Schema for POST /reports — Submit a content flag/report.
 */
export const createFlagSchema = z
  .object({
    contentType: z.string().trim().min(1, 'contentType is required'),
    contentId: z.string().trim().min(1, 'contentId is required'),
    contentPreview: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    flagType: z.string().trim().min(1, 'flagType is required'),
    reason: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for PUT /moderation/flags/:id/resolve — Resolve a flag.
 */
export const resolveFlagSchema = z
  .object({
    resolution: z.enum(['approved', 'removed', 'warned', 'banned'], {
      errorMap: () => ({ message: 'resolution must be approved, removed, warned, or banned' }),
    }),
    note: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for PUT /moderation/flags/:id/remove — Remove flagged content.
 */
export const removeFlaggedContentSchema = z
  .object({
    reason: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for POST /moderation/users/:userId/warn — Issue a warning.
 */
export const warnUserSchema = z
  .object({
    reason: z.string().trim().min(1, 'Reason is required'),
  })
  .strict();

/**
 * Schema for POST /moderation/notes — Add a moderator note.
 */
export const addModeratorNoteSchema = z
  .object({
    targetType: z.string().trim().min(1, 'targetType is required'),
    targetId: z.string().trim().min(1, 'targetId is required'),
    note: z.string().trim().min(1, 'note is required'),
  })
  .strict();

/**
 * Schema for POST /moderation/appeals — Submit an appeal.
 */
export const submitAppealSchema = z
  .object({
    flagId: z.string().trim().min(1, 'flagId is required'),
    reason: z.string().trim().min(1, 'reason is required'),
  })
  .strict();

/**
 * Schema for PUT /moderation/appeals/:id/review — Review an appeal.
 */
export const reviewAppealSchema = z
  .object({
    decision: z.enum(['upheld', 'overturned'], {
      errorMap: () => ({ message: 'decision must be upheld or overturned' }),
    }),
    decisionNote: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for POST /moderation/bulk-resolve — Bulk resolve flags.
 */
export const bulkResolveSchema = z
  .object({
    flagIds: z.array(z.string().trim().min(1)).min(1, 'flagIds array is required'),
    resolution: z.string().trim().min(1, 'resolution is required'),
    note: z.string().trim().optional(),
  })
  .strict();
