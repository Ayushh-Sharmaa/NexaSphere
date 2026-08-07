import { z } from "zod";
import { secretsManager } from "../services/secretsManager.js";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

const configValues = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: secretsManager.getSecret("CORS_ORIGIN"),
  DATABASE_URL: secretsManager.getSecret("DATABASE_URL"),
};

export const env = envSchema.parse(configValues);
