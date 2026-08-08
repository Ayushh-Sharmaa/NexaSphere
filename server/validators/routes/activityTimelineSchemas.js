import { z } from 'zod';

/**
 * Schema for POST /:userId — Add an activity to the timeline.
 * The activity body is spread into the timeline entry so we accept
 * known fields and allow extras for flexibility.
 */
export const addActivitySchema = z
  .object({
    type: z
      .enum(['event', 'portfolio', 'achievement'], {
        errorMap: () => ({ message: 'type must be event, portfolio, or achievement' }),
      })
      .optional(),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().max(2000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();
