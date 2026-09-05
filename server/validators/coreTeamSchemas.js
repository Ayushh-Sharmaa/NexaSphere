import { z } from 'zod';

export const manageActivityGateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(140),
  phone: z.string().trim().min(8).max(30),
  password: z.string().optional(),
  // Allow extra fields without failing.
}).passthrough();

