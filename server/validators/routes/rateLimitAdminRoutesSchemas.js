import { z } from 'zod';

export const overrideBodySchema = z
  .object({
    identifier: z.string().min(1, 'identifier is required'),
    limitPerMinute: z.number().int().positive('limitPerMinute must be a positive integer'),
  })
  .strict();

export const overrideParamsSchema = z
  .object({
    identifier: z.string().min(1),
  })
  .strict();

export const whitelistBodySchema = z
  .object({
    ip: z.string().min(1, 'ip is required'),
  })
  .strict();

export const whitelistParamsSchema = z
  .object({
    ip: z.string().min(1),
  })
  .strict();

export const blacklistBodySchema = z
  .object({
    ip: z.string().min(1, 'ip is required'),
  })
  .strict();

export const blacklistParamsSchema = z
  .object({
    ip: z.string().min(1),
  })
  .strict();

export const unblockBodySchema = z
  .object({
    ip: z.string().min(1, 'ip is required'),
  })
  .strict();
