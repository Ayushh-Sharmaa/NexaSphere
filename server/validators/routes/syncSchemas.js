import { z } from 'zod';

/**
 * A single change entry in a sync batch.
 */
const changeSchema = z.object({
  type: z.literal('event', {
    errorMap: () => ({ message: 'type "event" is the only supported sync type' }),
  }),
  id: z.string().trim().min(1, 'id is required'),
  data: z
    .object({
      name: z.string().trim().min(1, 'data.name is required'),
      description: z.string().trim().optional(),
      date_text: z.string().trim().optional(),
    })
    .passthrough(),
  lastKnownTimestamp: z.string().trim().optional(),
});

/**
 * Schema for POST /api/sync/batch — Submit a batch of sync changes.
 */
export const syncBatchSchema = z
  .object({
    changes: z.array(changeSchema).min(1, 'changes array is required'),
  })
  .strict();

/**
 * Schema for POST /api/sync/resolve-conflicts — Force-resolve sync conflicts.
 */
export const resolveConflictsSchema = z
  .object({
    changes: z
      .array(
        z.object({
          type: z.literal('event').optional(),
          id: z.string().trim().min(1).optional(),
          data: z
            .object({
              name: z.string().trim().min(1).optional(),
              description: z.string().trim().optional(),
              date_text: z.string().trim().optional(),
            })
            .passthrough()
            .optional(),
        })
      )
      .min(1, 'changes array is required'),
  })
  .strict();
