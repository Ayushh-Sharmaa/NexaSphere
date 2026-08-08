import { z } from 'zod';

/**
 * Schema for POST /api/admin/announcements — Create a new announcement.
 */
export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(255),
    content: z.string().trim().min(1, 'content is required'),
    category: z.string().trim().max(50).optional(),
    pinned: z.boolean().optional(),
    status: z.enum(['draft', 'scheduled', 'published', 'expired', 'archived']).optional(),
    scheduledFor: z.string().trim().nullable().optional(),
    expiresAt: z.string().trim().nullable().optional(),
    targetRole: z.string().trim().max(50).optional(),
    targetStage: z.string().trim().max(50).optional(),
    targetDepartment: z.string().trim().max(100).optional(),
    targetGraduationYear: z.number().int().positive().nullable().optional(),
    priority: z.enum(['info', 'warning', 'urgent']).optional(),
    ctaText: z.string().trim().max(100).nullable().optional(),
    ctaUrl: z.string().trim().max(2048).nullable().optional(),
  })
  .strict();

/**
 * Schema for PUT /api/admin/announcements/:id — Update an announcement.
 * All fields optional for partial updates.
 */
export const updateAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    content: z.string().trim().min(1).optional(),
    category: z.string().trim().max(50).optional(),
    pinned: z.boolean().optional(),
    status: z.enum(['draft', 'scheduled', 'published', 'expired', 'archived']).optional(),
    scheduledFor: z.string().trim().nullable().optional(),
    expiresAt: z.string().trim().nullable().optional(),
    targetRole: z.string().trim().max(50).optional(),
    targetStage: z.string().trim().max(50).optional(),
    targetDepartment: z.string().trim().max(100).optional(),
    targetGraduationYear: z.number().int().positive().nullable().optional(),
    priority: z.enum(['info', 'warning', 'urgent']).optional(),
    ctaText: z.string().trim().max(100).nullable().optional(),
    ctaUrl: z.string().trim().max(2048).nullable().optional(),
  })
  .strict();
