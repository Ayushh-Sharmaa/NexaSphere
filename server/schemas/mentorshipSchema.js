import { z } from 'zod';

const domainsSchema = z.union([z.array(z.string().max(50)), z.string()]).transform((val) => {
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
    return val.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
  }
  return val.slice(0, 10);
});

export const registerMentorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('Valid email is required'),
  domains: domainsSchema,
  bio: z.string().trim().max(2000).optional().default(''),
  experience: z.string().trim().max(100).optional().default(''),
  availability: z.string().trim().max(500).optional().default(''),
});

export const updateMentorSchema = z
  .object({
    domains: domainsSchema.optional(),
    bio: z.string().trim().max(2000).optional(),
    experience: z.string().trim().max(100).optional(),
    availability: z.string().trim().max(500).optional(),
    is_available: z.boolean().optional(),
  })
  .passthrough();

export const requestMentorshipSchema = z.object({
  mentor_id: z.number().int().positive('Mentor is required'),
  mentee_name: z.string().trim().min(1, 'Name is required').max(255),
  mentee_email: z.string().trim().email('Valid email is required'),
  mentee_domain: z.string().trim().max(100).optional().default(''),
  mentee_goals: z.string().trim().max(2000).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
});

export const logSessionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  notes: z.string().trim().max(5000).optional().default(''),
  duration_minutes: z.number().int().positive().optional(),
  session_date: z.string().optional(),
});

export const buddyPairSchema = z.object({
  buddy1_name: z.string().trim().min(1).max(255),
  buddy1_email: z.string().trim().email(),
  buddy2_name: z.string().trim().min(1).max(255),
  buddy2_email: z.string().trim().email(),
  domain: z.string().trim().max(100).optional().default('general'),
});

export const mentorshipPaginationSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    domain: z.string().optional(),
    q: z.string().optional(),
  })
  .passthrough();
