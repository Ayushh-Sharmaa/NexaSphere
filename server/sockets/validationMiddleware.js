import { z } from "zod";
import { TASK_STATUSES } from "../models/Task.js";

const MAX_PAYLOAD_SIZE = 50000; // 50KB limit to prevent memory exhaustion
const MAX_NESTING_DEPTH = 10; // Prevent deep object attacks

// Reusable schema pieces
const roomIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9\-_]{1,100}$/, "Invalid room ID");
const userNameSchema = z.string().max(100).optional();
const userEmailSchema = z
  .string()
  .email()
  .max(256)
  .optional()
  .or(z.literal(""));
const userColorSchema = z.string().max(20).optional();

// Schema definitions per event
// These enforce strict typing and bounds checking on incoming data
export const eventSchemas = {
  "user:identify": z.object({
    userId: z.string().max(128),
    email: z.string().max(256), // Allow non-email formats if that's how it's used, just max length
  }),
  "room:join": z.string().max(100),
  "room:leave": z.string().max(100),
  join_room: z
    .tuple([
      roomIdSchema,
      z
        .object({
          id: z.string().max(100).optional(),
          name: userNameSchema,
          email: userEmailSchema,
          color: userColorSchema,
        })
        .optional()
        .nullable(),
    ])
    .rest(z.any()), // Allow callback function as rest
  leave_room: z.tuple([roomIdSchema]).rest(z.any()),

  workspace_update: z
    .object({
      roomId: roomIdSchema.optional(),
    })
    .passthrough(),

  document_change: z
    .object({
      roomId: roomIdSchema.optional(),
    })
    .passthrough(),

  cursor_moved: z
    .object({
      roomId: roomIdSchema.optional(),
    })
    .passthrough(),

  typing_start: z
    .object({
      roomId: roomIdSchema.optional(),
      teamRoomId: roomIdSchema.optional(),
      user: z
        .object({
          name: userNameSchema,
        })
        .optional()
        .nullable(),
    })
    .passthrough(),

  typing_stop: z
    .object({
      roomId: roomIdSchema.optional(),
      teamRoomId: roomIdSchema.optional(),
    })
    .passthrough(),

  "admin:authenticate": z
    .object({
      token: z.string().max(1000).optional(),
    })
    .optional()
    .nullable(),

  task_create: z
    .object({
      roomId: roomIdSchema,
      task: z
        .object({
          title: z.string().max(255),
          _id: z.string().max(100).optional(),
          createdAt: z.string().max(100).optional(),
        })
        .passthrough(),
    })
    .optional()
    .nullable(),

  task_update_status: z
    .object({
      roomId: roomIdSchema,
      taskId: z.string().max(100),
      status: z.enum(TASK_STATUSES),
      previousStatus: z.string().max(50).optional().nullable(),
      updatedBy: z.string().max(100).optional().nullable(),
    })
    .optional()
    .nullable(),

  task_status_update: z
    .object({
      teamRoomId: roomIdSchema,
      taskId: z.string().max(100),
      newStatus: z.enum(TASK_STATUSES),
      previousStatus: z.string().max(50).optional().nullable(),
      updatedBy: z.string().max(100).optional().nullable(),
    })
    .optional()
    .nullable(),
};

function checkDepth(str) {
  let depth = 0;
  let maxDepth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "{" || str[i] === "[") {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (str[i] === "}" || str[i] === "]") {
      depth--;
    }
  }
  return maxDepth;
}

export function validationMiddleware(packet, next) {
  try {
    if (!Array.isArray(packet) || packet.length === 0) {
      return next(new Error("Invalid packet format"));
    }

    const event = packet[0];
    const args = packet.slice(1);

    // 1. Serialize to check size and depth
    const payloadString = JSON.stringify(args);

    // 2. Enforce Size Limit
    if (payloadString.length > MAX_PAYLOAD_SIZE) {
      return next(new Error("Payload too large"));
    }

    // 3. Enforce Nesting Depth
    if (checkDepth(payloadString) > MAX_NESTING_DEPTH) {
      return next(new Error("Payload too deeply nested"));
    }

    // 4. Schema Validation (if defined)
    const schema = eventSchemas[event];
    if (schema) {
      // Some events take multiple arguments (like join_room), others take a single argument object
      // For tuple schemas (multiple args), we validate args directly
      if (schema instanceof z.ZodTuple) {
        schema.parse(args);
      } else {
        // Single argument payload validation
        if (args.length > 0) {
          schema.parse(args[0]);
        }
      }
    }

    next();
  } catch (error) {
    if (error && error.name === "ZodError") {
      const issue =
        error.errors && error.errors.length > 0 ? error.errors[0] : null;
      const path = issue && issue.path ? issue.path.join(".") : "";
      const msg = issue ? issue.message : error.message;
      return next(
        new Error(`Validation error: ${path ? path + " " : ""}${msg}`)
      );
    }
    return next(new Error("Invalid payload structure"));
  }
}
