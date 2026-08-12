import { z } from 'zod';

/**
 * Reusable email field.
 */
const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .email('Invalid email address')
  .max(140);

/**
 * Reusable WhatsApp field — exactly 10 digits.
 */
const whatsappField = z
  .string({ required_error: 'WhatsApp number is required' })
  .trim()
  .regex(/^\d{10}$/, 'WhatsApp must be exactly 10 digits');

/**
 * Schema for POST /forms/membership and /submissions/membership.
 */
export const membershipFormSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(120),
    name: z.string().trim().min(1).max(120).optional(),
    collegeEmail: emailField,
    email: emailField.optional(),
    whatsapp: whatsappField,
    branch: z.string().trim().min(1, 'Branch is required').max(100),
    section: z.string().trim().min(1, 'Section is required').max(20),
    rollNumber: z.string().trim().max(40).optional(),
    course: z.string().trim().max(80).optional(),
    semester: z.string().trim().min(1, 'Semester is required').max(40),
    groups: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
        return String(val)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    reason: z.string().trim().max(1200).optional(),
    whyJoin: z.string().trim().max(1200).optional(),
    submittedAt: z.string().trim().max(80).optional(),
    userAgent: z.string().trim().max(255).optional(),
    formType: z.string().trim().max(40).optional(),
  })
  .passthrough();

/**
 * Schema for POST /forms/recruitment and /submissions/recruitment.
 */
export const recruitmentFormSchema = membershipFormSchema
  .extend({
    year: z.string().trim().min(1, 'Year is required').max(40),
    role: z.string().trim().max(80).optional(),
    interests: z.union([z.array(z.string()), z.string()]).optional(),
    skills: z.string().trim().max(400).optional(),
    comms: z.string().trim().max(400).optional(),
    campusExp: z.string().trim().max(60).optional(),
    campusExpDetails: z.string().trim().max(600).optional(),
    links: z.string().trim().max(600).optional(),
    commitHours: z.string().trim().max(40).optional(),
    attendCampus: z.string().trim().max(40).optional(),
    assessmentOk: z.string().trim().max(40).optional(),
    anythingElse: z.string().trim().max(1200).optional(),
    declarations: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

/**
 * Schema for POST /core-team/apply.
 */
export const coreTeamFormSchema = recruitmentFormSchema;
