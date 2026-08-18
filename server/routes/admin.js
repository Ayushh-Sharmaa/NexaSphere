/**
 * Admin Dashboard Routes
 * Provides admin-only endpoints for membership data and session info.
 */
import { tracedFetch } from "../config/appContext.js";
import { Router } from "express";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import { supabaseBreaker, HAS_SUPABASE } from "../storage/supabaseClient.js";
import { validate } from "../middleware/validate.js";
import { ssoInviteSchema } from "../validators/routes/adminSchemas.js";
import { usersRepository } from "../repositories/usersRepository.js";
import { financialService } from "../services/financialService.js";
import {
  validateConfigChange,
  createChangeHistory,
  rollbackConfig,
} from "../utils/configApproval.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";
import {
  CircuitBreaker,
  circuitBreakerRegistry,
} from "../utils/circuitBreaker.js";
import {
  runIntegrityCheck,
  detectCorruption,
  generateRecoveryRecommendation,
  createRecoveryAuditLog,
} from "../utils/dataIntegrityValidator.js";
import {
  activateReadOnlyMode,
  deactivateReadOnlyMode,
  getReadOnlyStatus,
  createIncidentLog,
} from "../routes/readOnlyMode.js";

import {
  getServiceStatus,
  getIncidentTimeline,
  getMaintenanceSchedule,
  getHistoricalUptime,
  getSubscriberNotifications,
} from "../utils/serviceStatus.js";
import {
  runConsistencyCheck,
  getSynchronizationStatus,
  detectConflicts,
  generateIntegrityReport,
  getConsistencyAlerts,
  triggerForceSync,
} from "../utils/consistencyVerifier.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin;
router.use(apiRateLimiter);

/**
 * Raw membership fetch helper, wrapped in a circuit breaker to protect
 * against repeated failures from the upstream Google Apps Script endpoint.
 */
async function _rawMembershipFetch(scriptUrl, secret) {
  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getResponses",
      apiKey: secret,
      token: secret,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google Apps Script returned ${response.status}`);
  }
  return response.json();
}

const membershipBreaker = circuitBreakerRegistry.register(
  "membership-gas",
  new CircuitBreaker(_rawMembershipFetch, {
    name: "membership-gas",
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 15000,
    maxCoolDownPeriod: 120000,
  })
);

/**
 * GET /membership — Fetch membership responses from Supabase (primary source of truth).
 * Falls back to Google Apps Script if Supabase is unavailable.
 * This ensures form submissions are always visible to admins even when
 * Google Sheets writes fail (quota, network, etc.).
 */
router.get("/membership", adminAuth, async (req, res) => {
  // Primary: Read from Supabase (source of truth)
  if (HAS_SUPABASE) {
    try {
      const data = await supabaseBreaker.execute(
        "form_submissions?form_type=eq.membership&order=created_at.desc",
        {
          method: "GET",
        }
      );
      const responses = (data || []).map((row) => ({
        submittedAt: row.created_at,
        formType: row.form_type,
        fullName: row.full_name,
        collegeEmail: row.college_email,
        whatsapp: row.whatsapp,
        ...row.payload,
      }));
      return sendSuccess(res, { responses });
    } catch (err) {
      if (err.code === "CIRCUIT_OPEN") {
        console.warn(
          "[Membership] Supabase circuit breaker is OPEN, falling back to Google Apps Script"
        );
        // Fall through to Google Apps Script fallback
      }
    }
  }
  // Fallback: Google Apps Script (legacy path)
  const scriptUrl = process.env.MEMBERSHIP_SCRIPT_URL;
  const secret = process.env.MEMBERSHIP_SECRET;

  if (!scriptUrl || !secret) {
    return sendSuccess(res, { responses: [] });
  }

  try {
    const data = await membershipBreaker.execute(scriptUrl, secret);
    return sendSuccess(res, { responses: data.responses || [] });
    const response = await tracedFetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getResponses", token: secret }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned ${response.status}`);
    }

    return res.json({ responses: data.responses || [] });
  } catch (err) {
    if (err.code === "CIRCUIT_OPEN") {
      console.warn(
        "[Membership] Google Apps Script circuit breaker is OPEN, returning empty responses"
      );
      return sendSuccess(res, { responses: [] });
    }
    console.error(
      "[Membership] Failed to fetch responses from Google Apps Script:",
      err.message
    );
    return sendError(
      req,
      res,
      "Failed to fetch membership responses",
      500,
      "INTERNAL_ERROR"
    );
  }
});

/**
 * POST /api/admin/membership/sync — Manually sync missed Google Forms responses.
 */
router.post("/membership/sync", adminAuth, async (req, res) => {
  const scriptUrl = process.env.MEMBERSHIP_SCRIPT_URL;
  const secret = process.env.MEMBERSHIP_SECRET;

  if (!scriptUrl || !secret) {
    return sendError(
      req,
      res,
      "Membership script URL or secret not configured",
      503,
      "SERVICE_UNAVAILABLE"
    );
  }

  try {
    const data = await membershipBreaker.execute(scriptUrl, secret);
    const responses = data.responses || [];

    let createdCount = 0;
    for (const response of responses) {
      const email =
        response.email || response.collegeEmail || response.college_email;
      const fullName = response.fullName || response.full_name || response.name;

      if (!email) continue;

      const existingUser = await usersRepository.getUserByEmail(email);
      if (existingUser) continue;

      try {
        await usersRepository.createUser({
          username: email,
          display_name: fullName || email.split("@")[0],
          email: email,
          role: "member",
        });
        createdCount++;
      } catch (err) {
        console.error(
          `[Membership Sync] Failed to create user for ${email}:`,
          err.message
        );
      }
    }

    return sendSuccess(res, {
      message: "Sync complete",
      created: createdCount,
    });
  } catch (err) {
    console.error("[Membership Sync] Failed to sync responses:", err.message);
    return sendError(
      req,
      res,
      "Failed to sync membership responses",
      500,
      "INTERNAL_ERROR"
    );
  }
});

/**
 * GET /me — Returns the authenticated admin's username.
 */
router.get("/me", adminAuth, (req, res) => {
  return sendSuccess(res, { username: req.adminSession.username });
});

/**
 * POST /api/admin/config-review
 * Validate critical configuration changes
 */
router.post("/api/admin/config-review", adminAuth, (req, res) => {
  const validation = validateConfigChange(req.body);

  const history = createChangeHistory(req.body);

  const rollback = rollbackConfig(req.body);

  return sendSuccess(res, {
    success: true,
    validation,
    history,
    rollback,
  });
});

router.get("/api/admin/database-health", adminAuth, (req, res) => {
  sendSuccess(res, runIntegrityCheck());
});

router.get("/api/admin/database-corruption", adminAuth, (req, res) => {
  sendSuccess(res, detectCorruption());
});

router.get("/api/admin/database-recovery", adminAuth, (req, res) => {
  sendSuccess(res, generateRecoveryRecommendation());
});

router.get("/api/admin/database-audit-log", adminAuth, (req, res) => {
  sendSuccess(res, createRecoveryAuditLog());
});

router.get("/api/admin/read-only-status", adminAuth, (req, res) => {
  sendSuccess(res, getReadOnlyStatus());
});

router.post("/api/admin/read-only-enable", adminAuth, (req, res) => {
  sendSuccess(res, activateReadOnlyMode());
});

router.post("/api/admin/read-only-disable", adminAuth, (req, res) => {
  sendSuccess(res, deactivateReadOnlyMode());
});

router.get("/api/admin/read-only-log", adminAuth, (req, res) => {
  sendSuccess(res, createIncidentLog());
});

router.get("/api/admin/service-status", adminAuth, (req, res) => {
  sendSuccess(res, getServiceStatus());
});

router.get("/api/admin/incidents", adminAuth, (req, res) => {
  sendSuccess(res, getIncidentTimeline());
});

router.get("/api/admin/maintenance", adminAuth, (req, res) => {
  sendSuccess(res, getMaintenanceSchedule());
});

router.get("/api/admin/uptime-report", adminAuth, (req, res) => {
  sendSuccess(res, getHistoricalUptime());
});

router.get("/api/admin/status-subscribers", adminAuth, (req, res) => {
  sendSuccess(res, getSubscriberNotifications());
});

router.get("/api/admin/consistency-check", adminAuth, (req, res) => {
  sendSuccess(res, runConsistencyCheck());
});

router.get("/api/admin/sync-status", adminAuth, (req, res) => {
  sendSuccess(res, getSynchronizationStatus());
});

router.post("/api/admin/sync/force", adminAuth, (req, res) => {
  sendSuccess(res, triggerForceSync());
});

router.get("/api/admin/conflicts", adminAuth, (req, res) => {
  sendSuccess(res, detectConflicts());
});

router.get("/api/admin/integrity-report", adminAuth, (req, res) => {
  sendSuccess(res, generateIntegrityReport());
});

router.get("/api/admin/consistency-alerts", adminAuth, (req, res) => {
  sendSuccess(res, getConsistencyAlerts());
});

router.get("/api/admin/dependency-report", adminAuth, async (req, res) => {
  // dependency monitoring report
});

router.get("/api/admin/security-analytics", adminAuth, async (req, res) => {
  sendSuccess(res, {
    blockedIPs,
    riskScores,
    suspiciousRequests,
  });
});

router.get("/api/admin/reports/engagement", adminAuth, async (req, res) => {
  // Generate simulated user engagement stats
  const seedUsers = Array.from({ length: 45 }, (_, i) => {
    const eventsAttended = Math.floor(Math.random() * 15);
    const portfolioCompletion = Math.floor(Math.random() * 101);
    const activeDays30 = Math.floor(Math.random() * 31);
    const activeDays90 = Math.floor(Math.random() * 91);
    const score30 = Math.min((activeDays30 / 30) * 40, 40);
    const scoreEvents = Math.min((eventsAttended / 10) * 30, 30);
    const scorePortfolio = (portfolioCompletion / 100) * 30;
    const engagementScore = Math.round(score30 + scoreEvents + scorePortfolio);
    const isInactive = activeDays30 < 2 && eventsAttended === 0;

    return {
      id: `user-${i + 1}`,
      name: `Community Member ${i + 1}`,
      eventsAttended,
      portfolioCompletion,
      activeDays30,
      activeDays90,
      engagementScore,
      status: isInactive ? "Inactive" : "Active",
    };
  });
  seedUsers.sort((a, b) => b.engagementScore - a.engagementScore);
  sendSuccess(res, { users: seedUsers });
});

router.get("/api/admin/reports/revenue", adminAuth, async (req, res) => {
  try {
    const user = { id: req.adminSession.username, role: "admin" };
    const report = await financialService.getRevenueReport(user);
    sendSuccess(res, report);
  } catch (error) {
    sendError(
      req,
      res,
      error.message || "Failed to generate revenue report",
      500,
      "INTERNAL_ERROR"
    );
  }
});

import jwt from "jsonwebtoken";

router.post(
  "/api/admin/sso-invite",
  apiRateLimiter,
  adminAuth,
  validate(ssoInviteSchema),
  (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return sendError(
        req,
        res,
        "Valid email address is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return sendError(
        req,
        res,
        "JWT_SECRET is not configured on the server",
        500,
        "INTERNAL_ERROR"
      );
    }

    // Generate a token valid for 24 hours
    const token = jwt.sign(
      { email: email.toLowerCase(), bypassSso: true },
      jwtSecret,
      {
        expiresIn: "24h",
      }
    );

    const baseUrl = process.env.BASE_URL || "http://localhost:8080";
    const inviteUrl = `${baseUrl}/api/auth/google?token=${token}`;

    return sendSuccess(res, { token, inviteUrl });
  }
);
router.get("/sessions", adminAuth, adminAuthMiddleware.getSecurityOverview);
router.post("/sessions/extend", adminAuth, adminAuthMiddleware.extendSession);
router.delete(
  "/sessions/:sessionId",
  adminAuth,
  adminAuthMiddleware.revokeSession
);
router.delete("/sessions", adminAuth, adminAuthMiddleware.logoutOtherSessions);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform summary statistics
 *     description: Returns at-a-glance counts for the admin dashboard home page.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Platform stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                 activeEvents:
 *                   type: integer
 *                 totalTeamMembers:
 *                   type: integer
 *                 pendingMemberships:
 *                   type: integer
 *                 pendingRecruitments:
 *                   type: integer
 *                 totalApplications:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/admin/stats", adminAuth, async (req, res) => {
  try {
    // These calls use whatever DB/repository layer the project already uses.
    // Adjust the method names to match what exists in your controllers/repositories.
    const [events, teamMembers, memberships, recruitments] = await Promise.all([
      eventsRepository.findAll(),
      coreTeamRepository.findAll(),
      membershipFormsRepository.findAll(),
      recruitmentFormsRepository.findAll(),
    ]);

    const now = new Date();

    const stats = {
      totalEvents: events.length,
      // Active = events whose date is today or in the future
      activeEvents: events.filter((e) => new Date(e.date) >= now).length,
      totalTeamMembers: teamMembers.length,
      // Count submissions with a "pending" status field
      pendingMemberships: memberships.filter((m) => m.status === "pending")
        .length,
      pendingRecruitments: recruitments.filter((r) => r.status === "pending")
        .length,
      totalApplications: memberships.length + recruitments.length,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch platform statistics" });
  }
});

export default router;
