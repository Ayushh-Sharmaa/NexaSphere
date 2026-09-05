import { z } from 'zod';

export const activityEventSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(120),
    date: z.string().trim().min(1).max(80),
    tagline: z.string().trim().max(240).optional().default(''),
    description: z.string().trim().min(1).max(1200),
    status: z.enum(['upcoming', 'completed']).optional().default('completed'),
    createdBy: z
      .object({
        name: z.string().trim().max(120).optional().default(''),
        email: z.string().trim().max(140).optional().default(''),
        phone: z.string().trim().max(30).optional().default(''),
      })
      .optional()
      .default(undefined),
  })
  .transform((data) => {
    const id = data.id || `manual-${Date.now()}`;
    return {
      ...data,
      id,
      status: data.status === 'upcoming' ? 'upcoming' : 'completed',
      tagline: data.tagline || '',
      createdBy: data.createdBy,
    };
  });

