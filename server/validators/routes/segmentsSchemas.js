import { z } from 'zod';

/** Schema for routes using :id param. */
export const idParamsSchema = z
  .object({
    id: z.string().min(1, 'Segment ID is required'),
  })
  .strict();

/** Schema for POST / body — create segment. */
export const createSegmentBodySchema = z
  .object({
    name: z.string().min(1, 'Segment name is required').max(255),
    description: z.string().optional(),
    criteria: z.any().optional(),
    auto_update: z.boolean().optional(),
  })
  .strict();

/** Schema for PUT /:id body — update segment (all fields optional). */
export const updateSegmentBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    criteria: z.any().optional(),
    auto_update: z.boolean().optional(),
  })
  .strict();
