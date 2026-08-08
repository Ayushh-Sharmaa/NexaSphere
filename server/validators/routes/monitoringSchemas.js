import { z } from 'zod';

export const rumMetricSchema = z
  .object({
    durationSeconds: z.number().finite().nonnegative(),
  })
  .strict();

export const keyRotationSchema = z.object({}).strict();

export const testErrorSchema = z.object({}).strict();
