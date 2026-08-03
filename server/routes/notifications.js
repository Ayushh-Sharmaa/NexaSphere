/**
 * Notification & Push Subscription Routes
 * Manages browser push subscriptions, notification CRUD,
 * read-state tracking, and user preferences with dual auth
 * (admin or student) and optional database persistence.
 */

import { Router } from "express";
import { body, validationResult } from "express-validator";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import { requireStudentAuth } from "../middleware/studentAuthMiddleware.js";
import { notificationRateLimiter } from "../middleware/rateLimiter.js";
import { requireNotificationPrefAuth } from "../middleware/auth/customAuth.js";
import notificationsService from "../services/notificationsService.js";
import { pushSubscriptionsRepository } from "../repositories/pushSubscriptionsRepository.js";
import { notificationPreferencesRepository } from "../repositories/notificationPreferencesRepository.js";
import { studentAuthService } from "../services/studentAuthService.js";
import { notificationSchema } from "../validators/notificationSchemas.js";
import { validate } from "../middleware/validate.js";
import {
  markReadSchema,
  markAllReadSchema,
  updatePreferencesSchema,
  bulkPreferencesSchema,
} from "../validators/routes/notificationsSchemas.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";

// Fallback dual auth for notification preferences (admin or student session)
const requireNotificationPrefAuthFallback = (req, res, next) => {
  if (req.cookies.ns_admin_token || req.headers.authorization) return next();
  return res.status(401).json({ error: "Unauthorized" });
};

const router = Router();

// ── Constants ───────────────────────────────────────────────────────────────
const PUSH_PERSISTENCE_ENABLED = Boolean(process.env.DATABASE_URL);

// ── In-memory push subscription store with persistence ──────────────────────
const pushSubscriptions = new Set();

async function loadPersistedPushSubscriptions() {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    const rows = await pushSubscriptionsRepository.list({ limit: 10000 });
    for (const sub of rows) {
      pushSubscriptions.add(JSON.stringify(sub));
    }
    console.log(`Loaded ${rows.length} persisted push subscription(s).`);
  } catch (err) {
    console.error("Failed to load persisted push subscriptions:", err.message);
  }
}

async function persistPushSubscription(subscription) {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    await pushSubscriptionsRepository.add(subscription);
  } catch (err) {
    console.error("Failed to persist push subscription:", err.message);
  }
}

async function removePersistedPushSubscription(subscription) {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    await pushSubscriptionsRepository.remove(subscription.endpoint);
  } catch (err) {
    console.error("Failed to remove persisted push subscription:", err.message);
  }
}

export { loadPersistedPushSubscriptions };

// ── Dual auth middleware (admin OR student) ─────────────────────────────────
function requireNotificationAuth(req, res, next) {
  adminAuthMiddleware.requireAdmin(req, res, (err) => {
    if (!err && req.adminSession) {
      return next();
    }
    requireStudentAuth(req, res, (err2) => {
      if (!err2 && req.studentUser) {
        return next();
      }
      return sendError(
        req,
        res,
        "Unauthorized: Authentication required",
        401,
        "UNAUTHORIZED"
      );
    });
  });
}

// ── Push subscription validation middleware ────────────────────────────────
const validatePushSubscription = [
  body("subscription").isObject().withMessage("subscription must be an object"),
  body("subscription.endpoint")
    .isURL()
    .withMessage("endpoint must be a valid URL")
    .isLength({ max: 2048 }),
  body("subscription.keys").isObject().withMessage("keys must be an object"),
  body("subscription.keys.p256dh")
    .isString()
    .isLength({ max: 256 })
    .withMessage("p256dh must be a string up to 256 chars"),
  body("subscription.keys.auth")
    .isString()
    .isLength({ max: 128 })
    .withMessage("auth must be a string up to 128 chars"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        req,
        res,
        "Invalid subscription payload",
        400,
        "VALIDATION_ERROR",
        errors.array()
      );
    }

    // Strict sanitization: reconstruct object to drop malicious properties
    const {
      endpoint,
      keys: { p256dh, auth },
    } = req.body.subscription;
    req.body.subscription = { endpoint, keys: { p256dh, auth } };

    next();
  },
];

// ── Push Subscription Routes ────────────────────────────────────────────────

/**
 * POST /notifications/subscribe — Register a push subscription.
 * Limits total stored subscriptions to 10 000 (FIFO eviction).
 */
router.post(
  "/notifications/subscribe",
  adminAuthMiddleware.requireAdmin,
  notificationRateLimiter,
  validatePushSubscription,
  async (req, res) => {
    try {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.add(JSON.stringify(subscription));
        if (pushSubscriptions.size > 10000) {
          const oldest = pushSubscriptions.values().next().value;
          pushSubscriptions.delete(oldest);
        }
        await persistPushSubscription(subscription);
      }
      return sendSuccess(res, { success: true });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

/**
 * POST /notifications/unsubscribe — Remove a push subscription.
 */
router.post(
  "/notifications/unsubscribe",
  adminAuthMiddleware.requireAdmin,
  notificationRateLimiter,
  validatePushSubscription,
  async (req, res) => {
    try {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.delete(JSON.stringify(subscription));
        await removePersistedPushSubscription(subscription);
      }
      return sendSuccess(res, { success: true });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

// ── Notification CRUD Routes (dual auth) ────────────────────────────────────

/**
 * POST /notifications/mark-read — Mark a single notification as read.
 */
router.post(
  "/notifications/mark-read",
  validate(markReadSchema),
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { id, userId } = req.body || {};
      if (!id)
        return sendError(req, res, "id required", 400, "VALIDATION_ERROR");
      let uid = userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return sendError(
            req,
            res,
            "Forbidden: Cannot modify other users notifications",
            403,
            "FORBIDDEN"
          );
        }
        uid = studentId;
      }
      const ok = await notificationsService.markAsRead(uid, id);
      return sendSuccess(res, { success: ok });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

/**
 * POST /notifications/mark-unread — Mark a single notification as unread.
 */
router.post(
  "/notifications/mark-unread",
  validate(markReadSchema),
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { id, userId } = req.body || {};
      if (!id)
        return sendError(req, res, "id required", 400, "VALIDATION_ERROR");
      let uid = userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return sendError(
            req,
            res,
            "Forbidden: Cannot modify other users notifications",
            403,
            "FORBIDDEN"
          );
        }
        uid = studentId;
      }
      const ok = await notificationsService.markAsUnread(uid, id);
      return sendSuccess(res, { success: ok });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

/**
 * POST /notifications/mark-all-read — Mark all notifications as read.
 */
router.post(
  "/notifications/mark-all-read",
  validate(markAllReadSchema),
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId } = req.body || {};
      let uid = userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return sendError(req, res, "Forbidden", 403, "FORBIDDEN");
        }
        uid = studentId;
      }
      await notificationsService.markAllAsRead(uid);
      return sendSuccess(res, { success: true });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

/**
 * DELETE /notifications/:id — Remove a specific notification by ID.
 */
router.delete(
  "/notifications/:id",
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const id = req.params.id;
      let uid = req.query.userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (req.query.userId && req.query.userId !== studentId) {
          return sendError(req, res, "Forbidden", 403, "FORBIDDEN");
        }
        uid = studentId;
      }
      const removed = await notificationsService.removeNotification(uid, id);
      if (!removed)
        return sendError(req, res, "Notification not found", 404, "NOT_FOUND");
      return sendSuccess(res, { success: true });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

/**
 * DELETE /notifications — Clear all notifications for a user.
 */
router.delete(
  "/notifications",
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      let uid = req.query.userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (req.query.userId && req.query.userId !== studentId) {
          return sendError(req, res, "Forbidden", 403, "FORBIDDEN");
        }
        uid = studentId;
      }
      await notificationsService.clearAll(uid);
      return sendSuccess(res, { success: true });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

/**
 * POST /notifications — Create a new notification (admin).
 */
router.post(
  "/notifications",
  validate(notificationSchema),
  adminAuthMiddleware.requireAdmin,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId, title, message, type, link } = req.body || {};
      if (!title || !message) {
        return sendError(
          req,
          res,
          "title and message are required",
          400,
          "VALIDATION_ERROR"
        );
      }
      const note = await notificationsService.addNotification(
        userId || "global",
        {
          title,
          message,
          type,
          link,
        }
      );
      return sendSuccess(res, { success: true, notification: note });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

// ── Notification Retrieval (dual auth) ─────────────────────────────────────

/**
 * GET /notifications — Retrieve notifications for the authenticated user.
 * Supports ?userId=, ?offset=N, ?limit=N query params.
 * Dual auth: admin session or student token.
 */
router.get("/notifications", async (req, res) => {
  try {
    const userId = req.query.userId || "global";
    const tab = req.query.tab || "all";
    const q = req.query.q || null;

    if (userId !== "global") {
      let authenticated = false;

      // 1. Try Student Auth
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
      if (!token && req.cookies?.ns_student_token) {
        token = req.cookies.ns_student_token;
      }
      if (token) {
        const payload = studentAuthService.verifyToken(token);
        if (payload && (payload.sub === userId || payload.id === userId)) {
          authenticated = true;
        }
      }

      // 2. Try Admin Auth
      if (!authenticated) {
        let adminToken = null;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          adminToken = authHeader.slice(7).trim();
        }
        if (!adminToken && req.cookies?.ns_admin_token) {
          adminToken = req.cookies.ns_admin_token;
        }
        if (adminToken) {
          const { getAdminSession } =
            await import("./repositories/adminSessionsRepository.js");
          const session = await getAdminSession(adminToken);
          if (session) {
            authenticated = true;
          }
        }
      }

      if (!authenticated) {
        return sendError(
          req,
          res,
          "Unauthorized to view these notifications",
          401,
          "UNAUTHORIZED"
        );
      }
    }

    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const list = await notificationsService.getNotifications(
      userId,
      offset,
      limit
    );
    return sendSuccess(res, { notifications: list });
  } catch (err) {
    return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
  }
});

router.get(
  "/notifications/preferences",
  requireNotificationAuth,
  async (req, res) => {
    try {
      const userId = req.query.userId || "global";
      const prefs = await notificationPreferencesRepository.list(userId);
      return sendSuccess(res, { preferences: prefs });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

router.put(
  "/notifications/preferences",
  requireNotificationAuth,
  async (req, res) => {
    try {
      const userId = req.body.userId || "global";
      const {
        category,
        email,
        push,
        in_app,
        sms,
        frequency,
        quiet_start,
        quiet_end,
        dnd,
      } = req.body;
      if (!category)
        return sendError(
          req,
          res,
          "category is required",
          400,
          "VALIDATION_ERROR"
        );

      const pref = await notificationPreferencesRepository.set(
        userId,
        category,
        {
          email,
          push,
          in_app,
          sms,
          frequency,
          quiet_start,
          quiet_end,
          dnd,
        }
      );
      return sendSuccess(res, { preference: pref });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

router.put(
  "/notifications/preferences/bulk",
  requireNotificationAuth,
  async (req, res) => {
    try {
      const userId = req.body.userId || "global";
      const { preferences } = req.body;
      if (!Array.isArray(preferences) || !preferences.length) {
        return sendError(
          req,
          res,
          "preferences array is required",
          400,
          "VALIDATION_ERROR"
        );
      }
      const results = await notificationPreferencesRepository.setBulk(
        userId,
        preferences
      );
      return sendSuccess(res, { preferences: results });
    } catch (err) {
      return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
    }
  }
);

// Notification analytics (lightweight collector)
router.post("/notifications/analytics", async (req, res) => {
  try {
    const event = req.body || {};
    // Minimal validation — in future route can forward to analytics pipeline
    console.log("[notification-analytics]", event.type || "unknown", event);
    return sendSuccess(res, { ok: true });
  } catch (err) {
    return sendError(req, res, err.message, 500, "INTERNAL_ERROR");
  }
});

// Notification analytics (lightweight collector)
router.post("/notifications/analytics", async (req, res) => {
  try {
    const event = req.body || {};
    // Minimal validation — in future route can forward to analytics pipeline
    console.log("[notification-analytics]", event.type || "unknown", event);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
