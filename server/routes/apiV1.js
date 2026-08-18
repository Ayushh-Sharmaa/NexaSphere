import express from "express";
import {
  requireClerkAuth,
  optionalClerkAuth,
} from "../middleware/auth/clerkAuth.js";
import {
  requireRole,
  requirePermission,
} from "../middleware/rbacMiddleware.js";
import { profilesService } from "../services/profilesService.js";
import { applicationsService } from "../services/applicationsService.js";
import { activitiesService } from "../services/activitiesService.js";
import { eventsService } from "../services/eventsService.js";
import { teamsService } from "../services/teamsService.js";
import { mentorsService } from "../services/mentorsService.js";
import { fundRequestsService } from "../services/fundRequestsService.js";
import { notificationsService } from "../services/notificationsService.js";
import { adminAnalyticsService } from "../services/adminAnalyticsService.js";
import logger from "../utils/logger.js";

const router = express.Router();

/* ── 1. Auth & Profile ─────────────────────────────────────────── */

router.post("/auth/sync", requireClerkAuth, async (req, res) => {
  try {
    const { email, fullName, avatarUrl } = req.body;
    const profile = await profilesService.syncProfile(req.auth.userId, {
      email: email || req.auth.claims?.email || "",
      fullName: fullName || req.auth.claims?.name || "Student",
      avatarUrl: avatarUrl || req.auth.claims?.picture,
    });
    return res.json({ success: true, data: { profile, role: req.auth.role } });
  } catch (err) {
    logger.error("Sync profile error:", err);
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "SYNC_ERROR", message: err.message },
      });
  }
});

router.get("/auth/me", requireClerkAuth, async (req, res) => {
  try {
    const profile = await profilesService.getProfileByClerkId(req.auth.userId);
    return res.json({
      success: true,
      data: {
        userId: req.auth.userId,
        role: req.auth.role,
        profile: profile || null,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "AUTH_ME_ERROR", message: err.message },
      });
  }
});

router.get("/profile", requireClerkAuth, async (req, res) => {
  try {
    const profile = await profilesService.getProfileByClerkId(req.auth.userId);
    return res.json({ success: true, data: { profile } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "PROFILE_FETCH_ERROR", message: err.message },
      });
  }
});

router.put("/profile", requireClerkAuth, async (req, res) => {
  try {
    const profile = await profilesService.updateProfile(
      req.auth.userId,
      req.body
    );
    return res.json({ success: true, data: { profile } });
  } catch (err) {
    return res
      .status(400)
      .json({
        success: false,
        error: { code: "PROFILE_UPDATE_ERROR", message: err.message },
      });
  }
});

/* ── 2. Applications (Student Lifecycle) ────────────────────────── */

router.get("/applications/status", requireClerkAuth, async (req, res) => {
  try {
    const summary = await applicationsService.getApplicationStatusSummary(
      req.auth.userId
    );
    return res.json({ success: true, data: summary });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "STATUS_SUMMARY_ERROR", message: err.message },
      });
  }
});

router.get("/applications", requireClerkAuth, async (req, res) => {
  try {
    const applications = await applicationsService.getApplicationsByClerkId(
      req.auth.userId
    );
    return res.json({ success: true, data: { applications } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "APPS_FETCH_ERROR", message: err.message },
      });
  }
});

router.post("/applications", requireClerkAuth, async (req, res) => {
  try {
    const { applicationType, payload, schemaVersion } = req.body;
    const application = await applicationsService.submitApplication(
      req.auth.userId,
      {
        applicationType,
        payload,
        schemaVersion,
      }
    );
    return res.status(201).json({ success: true, data: { application } });
  } catch (err) {
    const status =
      err.statusCode || (err.code === "DUPLICATE_APPLICATION" ? 409 : 400);
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || "APPLICATION_SUBMIT_ERROR",
        message: err.message,
        application: err.application,
      },
    });
  }
});

router.get("/applications/:id", requireClerkAuth, async (req, res) => {
  try {
    const application = await applicationsService.getApplicationDetails(
      req.params.id
    );
    if (!application) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Application not found" },
        });
    }

    // Authorization: User can only see their own application unless Admin
    if (
      application.clerk_user_id !== req.auth.userId &&
      !["admin", "super_admin"].includes(req.auth.role)
    ) {
      return res
        .status(403)
        .json({
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        });
    }

    // Hide internal reviewer notes from student API
    if (!["admin", "super_admin"].includes(req.auth.role)) {
      delete application.reviewer_notes;
    }

    return res.json({ success: true, data: { application } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "APP_DETAILS_ERROR", message: err.message },
      });
  }
});

/* ── 3. Admin Applications Management ──────────────────────────── */

router.get(
  "/admin/applications",
  requireClerkAuth,
  requireRole(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const { type, status, branch, year, search, page, limit } = req.query;
      const result = await applicationsService.listAdminApplications({
        type,
        status,
        branch,
        year,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res
        .status(500)
        .json({
          success: false,
          error: { code: "ADMIN_APPS_ERROR", message: err.message },
        });
    }
  }
);

router.patch(
  "/admin/applications/:id/status",
  requireClerkAuth,
  requireRole(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const { status, notes, reason } = req.body;
      const updated = await applicationsService.updateApplicationStatus(
        req.params.id,
        {
          status,
          notes,
          reason,
          adminUserId: req.auth.userId,
        }
      );
      return res.json({ success: true, data: { application: updated } });
    } catch (err) {
      const statusCode = err.statusCode || 400;
      return res
        .status(statusCode)
        .json({
          success: false,
          error: { code: "STATUS_UPDATE_ERROR", message: err.message },
        });
    }
  }
);

/* ── 4. Activities ─────────────────────────────────────────────── */

router.get("/activity-categories", (req, res) => {
  return res.json({
    success: true,
    data: { categories: activitiesService.getCategories() },
  });
});

router.get("/activities", async (req, res) => {
  try {
    const { type, search, page, limit } = req.query;
    const result = await activitiesService.listActivities({
      type,
      status: "published",
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "ACTIVITIES_FETCH_ERROR", message: err.message },
      });
  }
});

router.get("/activities/:id", async (req, res) => {
  try {
    const activity = await activitiesService.getActivityById(req.params.id);
    if (!activity) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Activity not found" },
        });
    }
    return res.json({ success: true, data: { activity } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "ACTIVITY_DETAIL_ERROR", message: err.message },
      });
  }
});

router.post(
  "/admin/activities",
  requireClerkAuth,
  requireRole(["admin", "super_admin", "core_member"]),
  async (req, res) => {
    try {
      const activity = await activitiesService.createActivity({
        ...req.body,
        createdBy: req.auth.userId,
      });
      return res.status(201).json({ success: true, data: { activity } });
    } catch (err) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "CREATE_ACTIVITY_ERROR", message: err.message },
        });
    }
  }
);

router.put(
  "/admin/activities/:id",
  requireClerkAuth,
  requireRole(["admin", "super_admin", "core_member"]),
  async (req, res) => {
    try {
      const updated = await activitiesService.updateActivity(
        req.params.id,
        req.body
      );
      return res.json({ success: true, data: { activity: updated } });
    } catch (err) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "UPDATE_ACTIVITY_ERROR", message: err.message },
        });
    }
  }
);

router.patch(
  "/admin/activities/:id/status",
  requireClerkAuth,
  requireRole(["admin", "super_admin", "core_member"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      const updated = await activitiesService.setActivityStatus(
        req.params.id,
        status
      );
      return res.json({ success: true, data: { activity: updated } });
    } catch (err) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "STATUS_ACTIVITY_ERROR", message: err.message },
        });
    }
  }
);

/* ── 5. Events & Registration ──────────────────────────────────── */

router.get("/events", async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await eventsService.listEvents({
      status: status || "upcoming",
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "EVENTS_FETCH_ERROR", message: err.message },
      });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Event not found" },
        });
    }
    return res.json({ success: true, data: { event } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "EVENT_DETAIL_ERROR", message: err.message },
      });
  }
});

router.post("/events/:id/register", requireClerkAuth, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const reg = await eventsService.registerForEvent(
      req.params.id,
      req.auth.userId,
      {
        fullName: fullName || req.auth.claims?.name || "Student",
        email: email || req.auth.claims?.email || "",
      }
    );
    return res.status(201).json({ success: true, data: { registration: reg } });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return res
      .status(statusCode)
      .json({
        success: false,
        error: { code: "EVENT_REG_ERROR", message: err.message },
      });
  }
});

router.get("/events/user/registrations", requireClerkAuth, async (req, res) => {
  try {
    const registrations = await eventsService.getUserRegistrations(
      req.auth.userId
    );
    return res.json({ success: true, data: { registrations } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "USER_REGS_ERROR", message: err.message },
      });
  }
});

/* ── 6. Teams & Mentors ────────────────────────────────────────── */

router.get("/teams", async (req, res) => {
  try {
    const { search, topic, page, limit } = req.query;
    const result = await teamsService.listTeams({
      search,
      topic,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "TEAMS_FETCH_ERROR", message: err.message },
      });
  }
});

router.post("/teams", requireClerkAuth, async (req, res) => {
  try {
    const team = await teamsService.createTeam(req.auth.userId, req.body);
    return res.status(201).json({ success: true, data: { team } });
  } catch (err) {
    return res
      .status(400)
      .json({
        success: false,
        error: { code: "TEAM_CREATE_ERROR", message: err.message },
      });
  }
});

router.post("/teams/:id/join", requireClerkAuth, async (req, res) => {
  try {
    const reqResult = await teamsService.requestJoinTeam(
      req.params.id,
      req.auth.userId,
      req.body.message
    );
    return res
      .status(201)
      .json({ success: true, data: { request: reqResult } });
  } catch (err) {
    return res
      .status(400)
      .json({
        success: false,
        error: { code: "TEAM_JOIN_ERROR", message: err.message },
      });
  }
});

router.get("/mentors", async (req, res) => {
  try {
    const { search, expertise, page, limit } = req.query;
    const result = await mentorsService.listMentors({
      search,
      expertise,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "MENTORS_FETCH_ERROR", message: err.message },
      });
  }
});

/* ── 7. Fund Requests ──────────────────────────────────────────── */

router.get("/fund-requests", requireClerkAuth, async (req, res) => {
  try {
    const requests = await fundRequestsService.getUserRequests(req.auth.userId);
    return res.json({ success: true, data: { requests } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "FUNDS_FETCH_ERROR", message: err.message },
      });
  }
});

router.post("/fund-requests", requireClerkAuth, async (req, res) => {
  try {
    const reqResult = await fundRequestsService.submitRequest(
      req.auth.userId,
      req.body
    );
    return res
      .status(201)
      .json({ success: true, data: { request: reqResult } });
  } catch (err) {
    return res
      .status(400)
      .json({
        success: false,
        error: { code: "FUND_SUBMIT_ERROR", message: err.message },
      });
  }
});

router.get(
  "/admin/fund-requests",
  requireClerkAuth,
  requireRole(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const { status, page, limit } = req.query;
      const result = await fundRequestsService.listAdminRequests({
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res
        .status(500)
        .json({
          success: false,
          error: { code: "ADMIN_FUNDS_ERROR", message: err.message },
        });
    }
  }
);

/* ── 8. Notifications & Analytics ──────────────────────────────── */

router.get("/notifications", requireClerkAuth, async (req, res) => {
  try {
    const { unreadOnly, page, limit } = req.query;
    const result = await notificationsService.getNotifications(
      req.auth.userId,
      {
        unreadOnly: unreadOnly === "true",
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }
    );
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "NOTIFICATIONS_ERROR", message: err.message },
      });
  }
});

router.patch("/notifications/:id/read", requireClerkAuth, async (req, res) => {
  try {
    const updated = await notificationsService.markAsRead(
      req.params.id,
      req.auth.userId
    );
    return res.json({ success: true, data: { notification: updated } });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "NOTIF_READ_ERROR", message: err.message },
      });
  }
});

router.post("/notifications/read-all", requireClerkAuth, async (req, res) => {
  try {
    await notificationsService.markAllAsRead(req.auth.userId);
    return res.json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "NOTIF_READ_ALL_ERROR", message: err.message },
      });
  }
});

router.get(
  "/admin/analytics",
  requireClerkAuth,
  requireRole(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const metrics = await adminAnalyticsService.getMetrics();
      return res.json({ success: true, data: { metrics } });
    } catch (err) {
      return res
        .status(500)
        .json({
          success: false,
          error: { code: "ANALYTICS_ERROR", message: err.message },
        });
    }
  }
);

export default router;
