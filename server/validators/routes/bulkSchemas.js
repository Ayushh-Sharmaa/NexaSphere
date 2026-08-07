import { z } from 'zod';

/**
 * Schema for the CSV body shared by preview / import endpoints.
 */
const csvBodySchema = z
  .object({
    csv: z.string().min(1, 'CSV data is required'),
  })
  .strict();

/**
 * Schema for POST /bulk/users/preview
 */
export const bulkUsersPreviewSchema = csvBodySchema;

/**
 * Schema for POST /bulk/users/import
 */
export const bulkUsersImportSchema = csvBodySchema;

/**
 * Schema for POST /bulk/users/role — bulk role assignment.
 */
export const bulkUsersRoleSchema = z
  .object({
    userIds: z.array(z.string().min(1)).min(1, 'At least one userId is required'),
    role: z.string().min(1, 'Role is required'),
  })
  .strict();

/**
 * Schema for POST /bulk/users/status — bulk status change.
 */
export const bulkUsersStatusSchema = z
  .object({
    userIds: z.array(z.string().min(1)).min(1, 'At least one userId is required'),
    status: z.string().min(1, 'Status is required'),
  })
  .strict();

/**
 * Schema for POST /bulk/users/tags — bulk tag assignment.
 */
export const bulkUsersTagsSchema = z
  .object({
    userIds: z.array(z.string().min(1)).min(1, 'At least one userId is required'),
    tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  })
  .strict();

/**
 * Schema for POST /bulk/users/email — bulk email sending.
 */
export const bulkUsersEmailSchema = z
  .object({
    userIds: z.array(z.string().min(1)).min(1, 'At least one userId is required'),
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().min(1, 'Message is required'),
  })
  .strict();

/**
 * Schema for POST /bulk/events/preview
 */
export const bulkEventsPreviewSchema = csvBodySchema;

/**
 * Schema for POST /bulk/events/import
 */
export const bulkEventsImportSchema = csvBodySchema;

/**
 * Schema for POST /bulk/events/status — bulk event status update.
 */
export const bulkEventsStatusSchema = z
  .object({
    eventIds: z.array(z.string().min(1)).min(1, 'At least one eventId is required'),
    status: z.string().min(1, 'Status is required'),
  })
  .strict();

/**
 * Schema for POST /bulk/events/clone — bulk event cloning.
 */
export const bulkEventsCloneSchema = z
  .object({
    eventIds: z.array(z.string().min(1)).min(1, 'At least one eventId is required'),
    offsetDays: z.number({
      required_error: 'offsetDays is required',
      invalid_type_error: 'offsetDays must be a number',
    }),
  })
  .strict();

/**
 * Schema for POST /bulk/events/remind — bulk reminder sending.
 */
export const bulkEventsRemindSchema = z
  .object({
    eventIds: z.array(z.string().min(1)).min(1, 'At least one eventId is required'),
  })
  .strict();
