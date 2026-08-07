import { z } from 'zod';

export const joinWaitlistSchema = z
  .object({
    eventId: z.union([z.string(), z.number()]),
    userId: z.union([z.string(), z.number()]),
    name: z.string().min(1, 'name is required'),
  })
  .strict();

export const autoEnrollSchema = z
  .object({
    eventId: z.union([z.string(), z.number()]),
  })
  .strict();

export const setDeadlineSchema = z
  .object({
    eventId: z.union([z.string(), z.number()]),
    deadline: z.string().min(1, 'deadline is required'),
  })
  .strict();
