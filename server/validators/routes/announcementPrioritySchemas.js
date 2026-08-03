import { z } from 'zod';

export const createAnnouncementSchema = z
  .object({
    title: z.string().min(1, 'title is required'),
    message: z.string().min(1, 'message is required'),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    pinned: z.boolean().optional(),
    expiresAt: z.string().optional().nullable(),
    audience: z.string().optional(),
  })
  .strict();

export const updatePriorityBodySchema = z
  .object({
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  })
  .strict();

export const updatePriorityParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const pinAnnouncementBodySchema = z
  .object({
    pinned: z.boolean(),
  })
  .strict();

export const pinAnnouncementParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const markReadBodySchema = z
  .object({
    userId: z.union([z.string(), z.number()]),
  })
  .strict();

export const markReadParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();
