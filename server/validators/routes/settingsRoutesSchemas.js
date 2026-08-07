import { z } from 'zod';

export const updateSettingsSchema = z
  .object({
    env: z.string().optional(),
    updates: z.object({}).passthrough(),
    preview: z.boolean().optional(),
  })
  .strict();

export const rollbackSettingSchema = z
  .object({
    logId: z.union([z.string(), z.number()]),
  })
  .strict();

export const importSettingsSchema = z
  .object({
    env: z.string().optional(),
    settings: z.object({}).passthrough(),
  })
  .strict();
