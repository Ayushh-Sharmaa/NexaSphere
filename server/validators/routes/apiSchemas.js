/**
 * Zod input schemas for mutation routes in `routes/api.js`.
 *
 * Each schema targets the *raw* request body fields that the corresponding
 * route handler actually reads.  Schemas use `.strict()` to reject unknown
 * fields unless the handler splats `req.body` into a downstream parse that
 * already handles extra keys (events, banners, activity events).
 *
 * @module
 */

import { z } from "zod";

// ──────────────────────────────────────────────
// Dashboard / Gamification
// ──────────────────────────────────────────────

/** POST /api/dashboard/xp — awardXP */
export const awardXPSchema = z
  .object({
    userId: z.string().trim().min(1, "userId is required"),
    amount: z
      .number({ required_error: "amount is required" })
      .int()
      .positive("amount must be a positive integer"),
  })
  .strict();

// ──────────────────────────────────────────────
// Whiteboard
// ──────────────────────────────────────────────

/** POST /api/whiteboard/export-pdf */
export const exportPDFSchema = z
  .object({
    content: z.string().trim().min(1, "Content is required"),
  })
  .strict();

// ──────────────────────────────────────────────
// Event Registration
// ──────────────────────────────────────────────

/** POST /api/content/events/:eventId/register */
export const eventRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(120),
    email: z.string().trim().email("Valid email is required").max(140),
    department: z.string().trim().max(80).optional().nullable(),
    year: z.string().trim().max(20).optional().nullable(),
    teamName: z.string().trim().max(120).optional().nullable(),
    teamSize: z.number().int().positive().optional().nullable(),
    customFields: z.any().optional().nullable(),
  })
  .strict();

/**
 * Reusable email-only body schema.
 *
 * Used by:
 *  - POST /api/content/events/:eventId/cancel
 *  - POST /api/content/events/:eventId/waitlist/confirm
 *  - DELETE /api/content/events/:eventId/waitlist
 */
export const emailSchema = z
  .object({
    email: z.string().trim().email("Valid email is required").max(140),
  })
  .strict();

// ──────────────────────────────────────────────
// Activity Events
// ──────────────────────────────────────────────

/**
 * POST /api/content/activity-events/:activityKey
 *
 * Lenient — the service constructs a separate payload and validates with
 * `activityEventSchema` internally.
 */
export const addActivityEventSchema = z
  .object({
    id: z.string().trim().optional(),
    name: z.string().trim().min(1, "Event name is required").max(120),
    date: z.string().trim().min(1, "Date is required"),
    tagline: z.string().trim().max(240).optional(),
    description: z.string().trim().min(1).max(1200),
    status: z.enum(["upcoming", "completed"]).optional(),
    coreTeamName: z.string().trim().max(120).optional(),
    coreTeamEmail: z.string().trim().max(140).optional(),
    coreTeamPhone: z.string().trim().max(30).optional(),
  })
  .strict()
  .passthrough(); // allow extra fields the service may map

// ──────────────────────────────────────────────
// Account Recovery
// ──────────────────────────────────────────────

/** POST /account-recovery/request */
export const accountRecoveryRequestSchema = z
  .object({
    email: z.string().trim().email("Valid email is required"),
  })
  .strict();

/** POST /account-recovery/verify */
export const accountRecoveryVerifySchema = z
  .object({
    email: z.string().trim().email("Valid email is required"),
    enteredCode: z.string().trim().min(1, "Recovery code is required"),
  })
  .strict();

// ──────────────────────────────────────────────
// Attendance
// ──────────────────────────────────────────────

/** POST /api/attendance/mark */
export const markAttendanceSchema = z
  .object({
    eventId: z.string().trim().min(1).optional(),
    token: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
  })
  .strict();

// ──────────────────────────────────────────────
// Admin — Users
// ──────────────────────────────────────────────

/** POST /api/admin/users */
export const adminCreateUserSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required").max(100),
    display_name: z.string().trim().max(200).optional(),
    email: z.string().trim().email("Valid email is required").max(254),
    role: z.string().trim().max(50).optional(),
  })
  .strict();

/** PUT /api/admin/users/:id */
export const adminUpdateUserSchema = z
  .object({
    display_name: z.string().trim().max(200).optional(),
    email: z.string().trim().email().max(254).optional(),
    phone_number: z.string().trim().max(30).optional(),
  })
  .strict();

export const adminUpdateUserRoleSchema = z
  .object({
    admin_roles: z.array(z.string()).optional(),
  })
  .strict();

// ──────────────────────────────────────────────
// Admin — Authentication
// ──────────────────────────────────────────────

/** POST /api/admin/login */
export const adminLoginSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required").max(128),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

/** POST /api/auth/local/login */
export const localLoginSchema = z
  .object({
    email: z.string().trim().email("Valid email is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

/** POST /api/admin/2fa/verify */
export const verifyTwoFactorSchema = z
  .object({
    challengeToken: z.string().min(1, "Challenge token is required"),
    code: z.string().min(1, "Verification code is required"),
  })
  .strict();

/** POST /api/admin/2fa/setup/verify */
export const verifyTwoFactorSetupSchema = z
  .object({
    setupToken: z.string().min(1, "Setup token is required"),
    code: z.string().min(1, "Verification code is required"),
  })
  .strict();

// ──────────────────────────────────────────────
// Admin — Events
// ──────────────────────────────────────────────

/**
 * POST /api/admin/events
 *
 * Lenient — the service does full validation via `eventSchema`.
 */
export const adminCreateEventSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required").max(120),
    shortName: z.string().trim().max(60).optional(),
    date: z.string().trim().min(1, "Date is required").max(80),
    description: z.string().trim().min(1).max(1200),
    status: z.enum(["upcoming", "completed"]).optional(),
    icon: z.string().trim().max(32).optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
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
  })
  .strict()
  .passthrough();

/** PUT /api/admin/events/:id — same shape, all optional */
export const adminUpdateEventSchema = adminCreateEventSchema.partial();

// ──────────────────────────────────────────────
// Admin — Subscriptions
// ──────────────────────────────────────────────

/** POST /api/admin/subscriptions */
export const createSubscriptionSchema = z
  .object({
    userId: z.string().trim().min(1, "userId is required"),
    tierId: z.string().trim().min(1, "tierId is required"),
  })
  .strict();

// ──────────────────────────────────────────────
// Admin — Banners
// ──────────────────────────────────────────────

/**
 * Base banner body fields (minus `id` — generated downstream).
 *
 * Used by:
 *  - POST /api/admin/banners
 *  - PUT /api/admin/banners/:id
 */
export const adminBannerBodySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    imageUrl: z.string().trim().url("Must be a valid URL"),
    linkUrl: z.string().trim().url().optional().nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .passthrough();
