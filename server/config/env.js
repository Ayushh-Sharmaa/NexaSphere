import { z } from 'zod';
import { secretsManager } from '../services/secretsManager.js';

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGIN: z.string(),
  DATABASE_URL: z.string().optional(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}

export const env = validateEnv();
