import { z } from 'zod';

/** Shared params schema for all /:username export routes. */
export const usernameParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
  })
  .strict();

/** Query schema for GET /:username/pdf. */
export const pdfQuerySchema = z
  .object({
    pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3']).default('A4'),
    includeContact: z.enum(['true', 'false']).default('true'),
    watermark: z.enum(['true', 'false']).default('true'),
  })
  .strict();

/** Query schema for GET /:username/website and /:username/website/html. */
export const websiteQuerySchema = z
  .object({
    includeSEO: z.enum(['true', 'false']).default('true'),
    includeAnalytics: z.enum(['true', 'false']).default('false'),
    analyticsId: z.string().default(''),
  })
  .strict();
