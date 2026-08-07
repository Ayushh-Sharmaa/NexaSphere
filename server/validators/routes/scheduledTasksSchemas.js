import { z } from 'zod';

export const updateTaskSchema = z
  .object({
    enabled: z.boolean().optional(),
    cron: z.string().optional(),
  })
  .strict();

export const triggerTaskSchema = z.object({}).strict();
