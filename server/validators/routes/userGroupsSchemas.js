import { z } from 'zod';

// ── Params Schemas ──────────────────────────────────────────────────────────────

/** Schema for routes using only :id param. */
export const groupIdParamsSchema = z
  .object({
    id: z.string().min(1, 'Group ID is required'),
  })
  .strict();

/** Schema for DELETE /admin/groups/:id/members/:studentId. */
export const groupMemberParamsSchema = z
  .object({
    id: z.string().min(1, 'Group ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
  })
  .strict();

// ── Body Schemas ────────────────────────────────────────────────────────────────

/** Schema for POST /admin/groups body — create group. */
export const createGroupBodySchema = z
  .object({
    name: z.string().min(1, 'Group name is required').max(255),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  })
  .strict();

/** Schema for PUT /admin/groups/:id body — update group (all fields optional). */
export const updateGroupBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  })
  .strict();

/** Schema for POST /admin/groups/:id/members body. */
export const addMembersBodySchema = z
  .object({
    studentIds: z.array(z.string().min(1)).min(1, 'At least one student ID is required'),
  })
  .strict();

/** Schema for POST /admin/groups/:id/email body. */
export const emailGroupBodySchema = z
  .object({
    subject: z.string().min(1, 'Subject is required').max(255),
    htmlContent: z.string().min(1, 'HTML content is required'),
  })
  .strict();
