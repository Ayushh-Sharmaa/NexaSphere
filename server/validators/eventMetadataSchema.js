import { z } from 'zod';

// Comma-separated or array input -> trimmed string array, capped for sanity.
const listField = (max = 24, itemMax = 160) =>
  z
    .union([z.array(z.string()), z.string()])
    .transform((val) => {
      if (Array.isArray(val)) return val;
      return String(val || '')
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    })
    .transform((arr) => arr.map((s) => String(s).trim().slice(0, itemMax)).filter(Boolean).slice(0, max))
    .optional()
    .default([]);

const personField = z
  .object({
    name: z.string().trim().max(120).optional().default(''),
    title: z.string().trim().max(160).optional().default(''),
  })
  .optional()
  .default({ name: '', title: '' });

export const ACTIVITY_CATEGORIES = [
  'Hackathon',
  'Codathon',
  'Ideathon',
  'Promptathon',
  'Workshop',
  'Insight Session',
  'Open Source Day',
  'Tech Debate',
];

// Extended fields for the advanced Admin Event Creation Engine.
// Everything here is optional so existing events / API callers keep working
// without changes; the whole object is stored as `metadata` (jsonb).
export const eventMetadataSchema = z
  .object({
    category: z.enum(ACTIVITY_CATEGORIES).optional(),
    topic: z.string().trim().max(160).optional().default(''),
    overview: z.string().trim().max(2000).optional().default(''),
    presenter: personField,
    judges: listField(12, 120),
    topicsCovered: listField(24, 160),
    highlights: listField(24, 200),
    facultyInCharge: z
      .object({
        name: z.string().trim().max(120).optional().default(''),
        department: z.string().trim().max(120).optional().default(''),
      })
      .optional()
      .default({ name: '', department: '' }),
    photosLink: z.string().trim().max(500).optional().default(''),
    videosLink: z.string().trim().max(500).optional().default(''),
    time: z.string().trim().max(80).optional().default(''),
    venue: z.string().trim().max(160).optional().default(''),
  })
  .partial()
  .optional()
  .default({});
