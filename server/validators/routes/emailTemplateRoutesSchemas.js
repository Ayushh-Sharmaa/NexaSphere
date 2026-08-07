import { z } from 'zod';

export const updateTemplateBodySchema = z
  .object({
    subject: z.string().min(1, 'subject is required'),
    body: z.string().min(1, 'body is required'),
  })
  .strict();

export const updateTemplateParamsSchema = z
  .object({
    name: z.string().min(1),
  })
  .strict();

export const resetTemplateParamsSchema = z
  .object({
    name: z.string().min(1),
  })
  .strict();

export const previewTemplateBodySchema = z
  .object({
    body: z.string().optional(),
  })
  .strict();

export const previewTemplateParamsSchema = z
  .object({
    name: z.string().min(1),
  })
  .strict();

export const testTemplateBodySchema = z
  .object({
    email: z.string().email('A valid email is required'),
    subject: z.string().optional(),
    body: z.string().optional(),
  })
  .strict();

export const testTemplateParamsSchema = z
  .object({
    name: z.string().min(1),
  })
  .strict();
