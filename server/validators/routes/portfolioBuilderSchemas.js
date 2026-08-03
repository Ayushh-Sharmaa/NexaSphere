import { z } from 'zod';

// ── Params Schemas ──────────────────────────────────────────────────────────────

/** Schema for routes using only :username param. */
export const usernameParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
  })
  .strict();

/** Schema for routes using :username and :sectionKey params. */
export const sectionParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    sectionKey: z.string().min(1, 'Section key is required'),
  })
  .strict();

/** Schema for PUT /:username/sections/:sectionKey/move/:direction. */
export const sectionWithDirectionParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    sectionKey: z.string().min(1, 'Section key is required'),
    direction: z.enum(['up', 'down']),
  })
  .strict();

/** Schema for POST /:username/sections/template/:templateId. */
export const templateParamsSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    templateId: z.string().min(1, 'Template ID is required'),
  })
  .strict();

// ── Body Schemas ────────────────────────────────────────────────────────────────

/**
 * Schema for POST /:username/sections body.
 * Section data is further validated in the service layer.
 */
export const addSectionBodySchema = z
  .object({
    type: z.string().min(1, 'Section type is required'),
    title: z.string().min(1).optional(),
    content: z.any().optional(),
    order: z.number().int().positive().optional(),
    visible: z.boolean().optional(),
  })
  .strict();

/**
 * Schema for PUT /:username/sections/:sectionKey body.
 * All fields optional for partial updates.
 */
export const updateSectionBodySchema = z
  .object({
    type: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    content: z.any().optional(),
    order: z.number().int().positive().optional(),
    visible: z.boolean().optional(),
  })
  .strict();

/** Schema for PUT /:username/sections/reorder body. */
export const reorderSectionsBodySchema = z
  .object({
    sections: z.array(z.string().min(1)).min(1, 'At least one section key required'),
  })
  .strict();

/**
 * Schema for PUT /:username/sections/:sectionKey/content body.
 * Content shape varies by section type so we accept any object.
 */
export const sectionContentBodySchema = z.object({}).passthrough();

/** Schema for POST /:username/sections/template/:templateId body. */
export const templateBodySchema = z
  .object({
    title: z.string().min(1).optional(),
    order: z.number().int().positive().optional(),
    visible: z.boolean().optional(),
  })
  .strict();
