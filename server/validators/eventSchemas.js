import { z } from 'zod';

const tagsSchema = z
  .union([z.array(z.string()).min(0), z.string()])
  .transform((val) => {
    if (Array.isArray(val)) return val;
    return String(val || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  })
  .transform((arr) => arr.map((t) => String(t).trim()).filter(Boolean).slice(0, 12))
  .optional()
  .default([]);

export const eventSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(120),
    shortName: z.string().trim().min(1).max(60).optional(),
    date: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(1200),
    status: z.enum(['upcoming', 'completed']).optional().default('completed'),
    icon: z.string().trim().max(32).optional().default('Pin'),
    tags: tagsSchema,
  })
  .transform((data) => {
    // Normalize fields to match DB expectations used previously.
    const status = data.status === 'upcoming' ? 'upcoming' : 'completed';
    const id =
      data.id ||
      String(data.shortName || data.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `event-${Date.now()}`;

    return {
      ...data,
      id,
      status,
      shortName: String(data.shortName || data.name),
      date: String(data.date),
      name: String(data.name),
      description: String(data.description),
      icon: String(data.icon || 'Pin').slice(0, 32),
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  });

