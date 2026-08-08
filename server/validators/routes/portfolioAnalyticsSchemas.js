import { z } from 'zod';

/**
 * Schema for POST /api/portfolio/:username/view — params validation.
 */
export const viewParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
  })
  .strict();

/**
 * Schema for GET /api/portfolio/:username/analytics — params validation.
 */
export const analyticsParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
  })
  .strict();

/**
 * Schema for GET /api/portfolio/:username/analytics — query validation.
 */
export const analyticsQuerySchema = z
  .object({
    passkey: z.string().min(1, 'Passkey is required'),
    days: z.coerce.number().int().positive('Days must be a positive integer').default(30),
  })
  .strict();
