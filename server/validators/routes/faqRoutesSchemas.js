import { z } from 'zod';

export const createFaqSchema = z
  .object({
    question: z.string().trim().min(1, 'Question is required'),
    answer: z.string().trim().min(1, 'Answer is required'),
    category: z.string().trim().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const updateFaqSchema = z
  .object({
    question: z.string().trim().optional(),
    answer: z.string().trim().optional(),
    category: z.string().trim().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const trackViewSchema = z.object({}).strict();

export const deleteFaqSchema = z.object({}).strict();
