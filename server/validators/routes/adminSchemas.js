import { z } from 'zod';

/**
 * Schema for POST /api/admin/sso-invite — Generate an SSO invite link.
 */
export const ssoInviteSchema = z
  .object({
    email: z.string().trim().email('Valid email address is required'),
  })
  .strict();
