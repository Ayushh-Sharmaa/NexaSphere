import { z } from "zod";
import { generatePrefixedId } from "../utils/uuid.js";

// Parses and clamps ?page / ?limit query parameters.
// page: positive integer, minimum 1, defaults to 1.
// limit: positive integer, clamped to [1, 100], defaults to 20.
export const paginationSchema = z
  .object({
    page: z
      .union([z.string(), z.number()])
      .transform((v) => {
        const parsed = parseInt(String(v), 10);
        return Math.max(1, Number.isNaN(parsed) ? 1 : parsed);
      })
      .optional()
      .default(1),
    limit: z
      .union([z.string(), z.number()])
      .transform((v) => {
        const parsed = parseInt(String(v), 10);
        return Math.min(100, Math.max(1, Number.isNaN(parsed) ? 20 : parsed));
      })
      .optional()
      .default(20),
  })
  .passthrough();

const tagsSchema = z
  .union([z.array(z.string()).min(0), z.string()])
  .transform((val) => {
    if (Array.isArray(val)) return val;
    return String(val || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  })
  .transform((arr) =>
    arr
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 12)
  )
  .optional()
  .default([]);

export const baseEventSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  shortName: z.string().trim().min(1).max(60).optional(),
  date: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(1200),
  status: z.enum(["upcoming", "completed"]).optional().default("completed"),
  icon: z.string().trim().max(32).optional().default("Pin"),
  tags: tagsSchema,
  seriesId: z.string().optional().nullable(),
  recurrencePattern: z
    .enum(["daily", "weekly", "monthly", "custom"])
    .optional()
    .nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  occurrenceIndex: z.number().int().optional().nullable(),
  capacity: z.coerce.number().int().min(1).optional().nullable(),
  isHybrid: z.boolean().optional().default(false),
  videoLink: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const eventSchema = baseEventSchema.transform((data) => {
  // Normalize fields to match DB expectations used previously.
  const status = data.status === "upcoming" ? "upcoming" : "completed";
  const id =
    data.id ||
    String(data.shortName || data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    generatePrefixedId("event");

  return {
    ...data,
    id,
    status,
    shortName: String(data.shortName || data.name),
    date: String(data.date),
    name: String(data.name),
    description: String(data.description),
    icon: String(data.icon || "Pin").slice(0, 32),
    tags: Array.isArray(data.tags) ? data.tags : [],
    seriesId: data.seriesId || null,
    recurrencePattern: data.recurrencePattern || null,
    recurrenceEndDate: data.recurrenceEndDate || null,
    occurrenceIndex: data.occurrenceIndex || null,
    capacity: data.capacity || null,
    isHybrid: data.isHybrid || false,
    videoLink: data.videoLink || null,
    location: data.location || null,
  };
});

export const eventPatchSchema = baseEventSchema.partial();
