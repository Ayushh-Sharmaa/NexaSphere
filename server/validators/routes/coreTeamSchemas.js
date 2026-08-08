import { z } from 'zod';

/**
 * Schema for POST /api/admin/core-team — Add a new core team member.
 */
export const addCoreTeamMemberSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(100),
    role: z.string().trim().min(1, 'role is required').max(100),
    year: z.string().trim().min(1, 'year is required').max(20),
    branch: z.string().trim().min(1, 'branch is required').max(100),
    section: z.string().trim().min(1, 'section is required').max(12),
    email: z.string().trim().email('Invalid email format').max(140),
    whatsapp: z.string().trim().min(10, 'whatsapp must be at least 10 characters').max(30),
    linkedin: z.string().trim().max(255).nullable().optional(),
    instagram: z.string().trim().max(255).nullable().optional(),
    photoUrl: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

/**
 * Schema for POST /api/core-team/apply — Student submits core team application.
 */
export const submitApplicationSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(100),
    email: z.string().trim().email('Invalid email format').max(200),
    year: z.string().trim().min(1, 'year is required').max(10),
    branch: z.string().trim().min(1, 'branch is required').max(100),
    section: z.string().trim().min(1, 'section is required').max(12),
    whatsapp: z.string().trim().min(10, 'whatsapp must be at least 10 digits').max(30),
    reason: z.string().trim().min(1, 'reason is required').max(2000),
  })
  .strict();

/**
 * Schema for POST /api/admin/core-team/applications/:id/approve + reject
 * Optional reviewNote.
 */
export const reviewApplicationSchema = z
  .object({
    reviewNote: z.string().trim().max(500).optional(),
  })
  .strict();
