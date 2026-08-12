import { z } from 'zod';

/**
 * Schema for POST /notifications/mark-read — Mark a single notification as read.
 */
export const markReadSchema = z
  .object({
    id: z.string().trim().min(1, 'id is required'),
    userId: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for POST /notifications/mark-all-read — Mark all notifications as read.
 */
export const markAllReadSchema = z
  .object({
    userId: z.string().trim().optional(),
  })
  .strict();

/**
 * Schema for PUT /notifications/preferences — Update notification preferences.
 */
export const updatePreferencesSchema = z
  .object({
    userId: z.string().trim().optional(),
    category: z.string().trim().min(1, 'category is required'),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    in_app: z.boolean().optional(),
    sms: z.boolean().optional(),
    frequency: z.string().trim().optional(),
    quiet_start: z.string().trim().optional(),
    quiet_end: z.string().trim().optional(),
    dnd: z.boolean().optional(),
  })
  .strict();

/**
 * Schema for PUT /notifications/preferences/bulk — Bulk update notification preferences.
 */
export const bulkPreferencesSchema = z
  .object({
    userId: z.string().trim().optional(),
    preferences: z.array(z.record(z.string(), z.unknown())).min(1, 'preferences array is required'),
  })
  .strict();
