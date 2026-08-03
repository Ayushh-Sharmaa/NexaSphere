import { z } from 'zod';

// ── Params Schemas ──────────────────────────────────────────────────────────────

/** Schema for /admin/users/:id routes. */
export const userIdParamsSchema = z
  .object({
    id: z.string().min(1, 'User ID is required'),
  })
  .strict();

/** Schema for /admin/portfolios/:username routes. */
export const usernameParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
  })
  .strict();

// ── Body Schemas ────────────────────────────────────────────────────────────────

/** Schema for POST /admin/users/:id/reset-password body. */
export const adminResetPasswordBodySchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict();

/** Schema for POST /auth/forgot-password body. */
export const forgotPasswordBodySchema = z
  .object({
    email: z.string().email('A valid email address is required'),
  })
  .strict();

/** Schema for POST /auth/reset-password body. */
export const resetPasswordWithTokenBodySchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict();
