import { z } from 'zod';

export const enrollSchema = z
  .object({
    targetWeeks: z.number().int().positive().max(52).optional().default(12),
    initialLevel: z.number().int().min(1).max(10).optional().default(1),
  })
  .strict();

export const assessSchema = z
  .object({
    score: z.number().min(0).max(10),
  })
  .strict();

export const completeMilestoneSchema = z
  .object({
    pathId: z.string().min(1, 'pathId is required'),
  })
  .strict();

export const idParamSchema = z
  .object({
    id: z.string().min(1, 'Learning path ID is required'),
  })
  .strict();

export const milestoneIdParamSchema = z
  .object({
    milestoneId: z.string().min(1, 'Milestone ID is required'),
  })
  .strict();
