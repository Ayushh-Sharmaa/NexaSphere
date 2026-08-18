import logger from "./utils/logger.js";
import { getRedisClient } from "./utils/redis.js";
import "dotenv/config";
import { tracedFetch } from "./config/appContext.js";
import { initObservability } from "./observability/index.js";
import { setTraceIdResolver } from "./utils/logContext.js";
import { getActiveTraceId } from "./observability/tracing.js";
import helmet from "helmet";
import express from "express";
import cors from "cors";
import csrf from "csurf";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import fs, { promises as fsp } from "fs";
import { body, validationResult } from "express-validator";
import { EventEmitter } from "events";
import { google } from "googleapis";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { sendWelcomeVerificationEmail } from "./services/emailService.js";
import { ZodError } from "zod";
import { normalizeFormSubmission } from "./validators/formSchemas.js";
import { adminAuthMiddleware } from "./middleware/adminAuthMiddleware.js";
import analyticsRouter from "./routes/analytics.js";
import apiRouter from "./routes/api.js";
import formSubmissionsRouter from "./routes/forms.js";
import { logEvent } from "./controllers/analyticsController.js";
import healthDashboardRouter from "./routes/healthDashboard.js";
import complianceRouter from "./routes/compliance.js";
import { eventRemindersQueue } from "./services/queueService.js";
import { slackIntegrationService } from "./services/slackIntegrationService.js";

import adminStreamRouter from "./routes/adminStream.js";
import documentationRouter from "./routes/documentation.js";
import monitoringRouter from "./routes/monitoring.js";
import coreTeamRouter from "./routes/coreTeam.js";
import portfolioRouter from "./routes/portfolio.js";
import "./workers/reminderWorker.js";
import portfolioExportRouter from "./routes/portfolioExport.js";
import userGroupsRouter from "./routes/userGroups.js";
import notificationsRouter from "./routes/notifications.js";
import adminRouter from "./routes/admin.js";
import announcementsRouter from "./routes/announcements.js";
import bulkRouter from "./routes/bulk.js";
import apiV1Router from "./routes/apiV1.js";
import { validateEnvironment } from "./utils/envValidator.js";
import { performanceMonitor } from "./middleware/performanceMonitor.js";
import { enhancedTracingMiddleware } from "./middleware/enhancedTracingMiddleware.js";
import { apiLogger } from "./middleware/apiLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { notificationAnalyticsRepository } from "./repositories/notificationAnalyticsRepository.js";
import { notificationPreferencesRepository } from "./repositories/notificationPreferencesRepository.js";
import notificationsService from "./services/notificationsService.js";
import { studentAuthService } from "./services/studentAuthService.js";
import { initializeSentry, addSentryErrorHandler } from "./utils/sentry.js";
import {
  apiRateLimiter,
  formRateLimiter,
  notificationRateLimiter,
  activityAuthRateLimiter,
  portfolioRateLimiter,
  searchRateLimiter,
  validateLimiters,
} from "./middleware/rateLimiter.js";
import {
  authRateLimiter,
  protectedActionRateLimiter,
  passwordResetRateLimiter,
} from "./middleware/authRateLimiter.js";
import { portfolioRepository } from "./repositories/portfolioRepository.js";
import {
  portfolioContentSchema,
  portfolioPutSchema,
} from "./validators/portfolioSchemas.js";
import { searchController } from "./controllers/searchController.js";
import { Mutex } from "async-mutex";
import {
  CircuitBreaker,
  circuitBreakerRegistry,
} from "./utils/circuitBreaker.js";
import { getPublicAppUrl } from "./utils/publicAppUrl.js";
import * as eventsController from "./controllers/eventsController.js";
import "./workers/bulkWorker.js";
import * as activityEventsController from "./controllers/activityEventsController.js";
import * as streamController from "./controllers/streamController.js";
import * as coreTeamController from "./controllers/coreTeamController.js";
import { coreTeamService } from "./services/coreTeamService.js";
import { readOnlyGuard } from "./services/readOnlyService.js";
import {
  HAS_SUPABASE,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} from "./storage/supabaseClient.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const RedisStore = require("connect-redis").default || require("connect-redis");
import Redis from "ioredis";
import passport from "./config/studentOAuth.js";
import { studentUsersRepository } from "./repositories/studentUsersRepository.js";
import { slackRepository } from "./repositories/slackRepository.js";
import * as studentAuthController from "./controllers/studentAuthController.js";
import * as forumController from "./controllers/forumController.js";
import { requireStudentAuth } from "./middleware/studentAuthMiddleware.js";
import { loadPersistedPushSubscriptions } from "./routes/notifications.js";
import { getAdminSession } from "./repositories/adminSessionsRepository.js";
import * as mentorshipController from "./controllers/mentorshipController.js";
import { xssSanitizer } from "./middleware/xssSanitizer.js";
import { tierRateLimiter } from "./middleware/tierRateLimiter.js";
import { startWebhookRetryProcessor } from "./services/webhookRetryProcessor.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";
import compression from "compression";
import syncRouter from "./routes/sync.js";
import multer from "multer";
import learningPathRouter from "./routes/learningPaths.js";
import { learningPathService } from "./services/learningPathService.js";
import * as resourcesController from "./controllers/resourcesController.js";
import * as backupController from "./controllers/backupController.js";
import scheduledTasksRouter from "./routes/scheduledTasks.js";
import financialsRouter from "./routes/financials.js";
import { schedulerService } from "./services/schedulerService.js";
import feedbackRouter from "./routes/feedbackRoutes.js";
import * as slackController from "./controllers/slackController.js";
import smartFormsRouter from "./routes/smartForms.js";
import activityTimelineRoutes from "./routes/activityTimeline.js";

import moderationRouter from "./routes/moderation.js";
import rbacRouter from "./routes/rbac.js";
import { startStreamingWorkers } from "./streaming/startStreamingWorkers.js";
import {
  listEventsStore,
  createEventStore,
  listActivityEventsStore,
  createActivityEventStore,
  deleteActivityEventStore,
  listCoreTeamStore,
  createCoreTeamStore,
  deleteCoreTeamStore,
  appendToSupabaseForms,
  timingSafeStringEqual,
  toSafeString,
  validateWhatsApp,
  validateSection,
  normalizePhone,
} from "./repositories/contentStore.js";
import {
  checkPasskeyLockout,
  recordFailedPasskeyAttempt,
  clearPasskeyAttempts,
} from "./middleware/auth/passkeyLockout.js";
import {
  checkActivityAuthLockout,
  recordFailedActivityAuth,
  clearActivityAuthAttempts,
  canManageActivityEvent,
} from "./middleware/auth/activityAuth.js";
import {
  requireNotificationPrefAuth,
  requireMentorshipAuth,
} from "./middleware/auth/customAuth.js";
import circuitBreakerRouter from "./routes/circuitBreaker.js";
import { validate } from "./middleware/validate.js";
import * as indexSchemas from "./validators/routes/indexSchemas.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "./utils/responseHelper.js";
import apiKeysRouter from "./routes/apiKeys.js";
import { apiKeysRepository } from "./repositories/apiKeysRepository.js";

import { initializeSocketIO, emitToRoom, getRoom } from "./config/socket.js";
import { broadcastSSEEvent } from "./services/sseService.js";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, "data", "content.json");

validateEnvironment();

function requiredStrongPassword(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    if (
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development" ||
      !process.env.NODE_ENV
    ) {
      return name.includes("SECRET")
        ? "DevTestSessionSecret123!@#"
        : "StrongDefaultPass123!";
    }
    throw new Error(`Missing environment variable: ${name}`);
  }
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  if (value.length < 12 || !hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    if (
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development" ||
      !process.env.NODE_ENV
    ) {
      return value || "StrongDefaultPass123!";
    }
    throw new Error(
      `${name} must be at least 12 characters and include uppercase, lowercase, number, and symbol`
    );
  }
  return value;
}
const ADMIN_EVENT_PASSWORD = requiredStrongPassword("ADMIN_EVENT_PASSWORD");
const SESSION_SECRET = requiredStrongPassword("SESSION_SECRET");
const ADMIN_PASSWORD = requiredStrongPassword("ADMIN_PASSWORD");

// Complete code for server/index.js
/**
 * Server entry point.
 *
 * @file server/index.js
 * @author Ayushh Sharma
 * @description Server entry point.
 */

// Create an Express app instance
const app = express();

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, path } = req;

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const message = `[${method}] ${path} → ${status} (${Math.round(duration)}ms)`;

    if (status >= 500) {
      console.error(message);
    } else if (status >= 400) {
      console.warn(message);
    } else {
      console.log(message);
    }
  });

  next();
}
initializeSentry(app);
app.use(compression());

const corsOrigin =
  process.env.CORS_ORIGIN ||
  (process.env.NODE_ENV === "test" ? "http://localhost,http://127.0.0.1" : "");
if (!corsOrigin) {
  throw new Error("CORS_ORIGIN environment variable must be set.");
}

app.use(requestLogger);
const allowedOrigins = corsOrigin
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// FEATURE #3259: Wrap requestLogger to prevent duplicate logging executions
const useStructuredHttpLog =
  process.env.NODE_ENV === "production" ||
  process.env.USE_STRUCTURED_LOG === "true";

if (useStructuredHttpLog) {
  app.use(requestLogger);
}

app.use(
  helmet({
    // Prevent MIME sniffing
    noSniff: true,

    // Prevent clickjacking
    frameguard: {
      action: "deny",
    },

    // Hide X-Powered-By
    hidePoweredBy: true,

    // Enable XSS filter (legacy IE/Edge protection)
    xssFilter: true,

    // Restrict referrer leakage
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },

    // Enforce HTTPS in production
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,

    // Strict Content Security Policy
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://api.dicebear.com",
          "https://images.unsplash.com",
          "https://www.google-analytics.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        connectSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://*.ingest.sentry.io",
          "https://*.ingest.us.sentry.io",
          "https://www.google-analytics.com",
          process.env.FRONTEND_URL || "http://localhost:5173",
          `wss://${process.env.DOMAIN || "localhost"}`,
        ],
        objectSrc: ["'none'"],

        //  feat/i18n-localization-1397
        //  feat/i18n-localization-1397

        //  fix/csp-helmet-config-1475
        //  main
        // ✅ CRITICAL FIX: Missing directives added below
        baseUri: ["'self'"], // Prevents <base> tag injection
        frameAncestors: ["'none'"], // Prevents clickjacking
        formAction: ["'self'"], // Prevents form submission to external sites
        workerSrc: ["'self'", "blob:"], // Restricts web worker sources
        manifestSrc: ["'self'"], // Restricts manifest sources
        mediaSrc: ["'self'"], // Restricts media sources
        frameSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://maps.google.com",
        ], // Restricts iframe sources
        childSrc: ["'none'"], // Restricts child browsing contexts
        upgradeInsecureRequests: [], // Upgrades HTTP to HTTPS

        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'"],
        frameSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://maps.google.com",
        ],
        childSrc: ["'none'"],
        upgradeInsecureRequests: [],
        // ✅ CRITICAL FIX: Missing directives added below
        baseUri: ["'self'"], // Prevents <base> tag injection
        frameAncestors: ["'none'"], // Prevents clickjacking
        formAction: ["'self'"], // Prevents form submission to external sites
        workerSrc: ["'self'", "blob:"], // Restricts web worker sources
        manifestSrc: ["'self'"], // Restricts manifest sources
        mediaSrc: ["'self'"], // Restricts media sources
        frameSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://maps.google.com",
        ], // Restricts iframe sources
        childSrc: ["'none'"], // Restricts child browsing contexts
        upgradeInsecureRequests: [], // Upgrades HTTP to HTTPS

        reportUri: "/api/v1/csp-violation",
      },
    },

    // Safer cross-origin behavior
    crossOriginEmbedderPolicy: false,

    crossOriginOpenerPolicy: {
      policy: "same-origin",
    },

    crossOriginResourcePolicy: {
      policy: "same-origin",
    },

    // Disable DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },

    // Prevent browser feature abuse
    permissionsPolicy: {
      features: {
        geolocation: [],
        microphone: [],
        camera: [],
        payment: [],
        usb: [],
        magnetometer: [],
        gyroscope: [],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === "test") {
        try {
          const url = new URL(origin);
          if (
            url.hostname === "localhost" ||
            url.hostname === "127.0.0.1" ||
            url.hostname === "[::1]" ||
            url.hostname === "::1"
          ) {
            return callback(null, true);
          }
        } catch {}
      }
      return callback(new Error("CORS Policy: Origin not allowed."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);
app.options("*", cors());

app.use(enhancedTracingMiddleware);

app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));
app.use(xssSanitizer);
if (useStructuredHttpLog) {
  app.use(apiLogger);
} else {
  app.use(morgan("combined"));
}
app.use(performanceMonitor);
app.use(cookieParser());
app.use(sessionMiddleware);

// Verify Redis URL protocol in production
const redisSessionUrl = process.env.REDIS_URL || "";
if (
  process.env.NODE_ENV === "production" &&
  !redisSessionUrl.startsWith("rediss://")
) {
  logger.warn(
    "Redis TLS security warning: URL should use rediss:// for production"
  );
}
// Reuse the existing getRedisClient if possible, else create a new one
let sessionClient = getRedisClient();
if (!sessionClient) {
  sessionClient = new Redis(redisSessionUrl);
}
app.use(
  session({
    store: new RedisStore({
      client: sessionClient,
      prefix: "session:express:",
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "ns_session",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge:
        process.env.NODE_ENV === "production"
          ? 8 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000,
    },
  })
);
// Session logging middleware
app.use((req, res, next) => {
  if (req.session && !req.session.created_at) {
    req.session.created_at = Date.now();
    req.session.ip = req.ip || req.connection?.remoteAddress || "unknown";
    logger.info(
      "[Session] New session created:",
      req.sessionID,
      "IP:",
      req.session.ip
    );
  } else if (
    req.session &&
    req.session.ip &&
    req.session.ip !== (req.ip || req.connection?.remoteAddress)
  ) {
    logger.warn(
      {
        originalIp: req.session.ip,
        newIp: req.ip || req.connection?.remoteAddress,
        sessionId: req.sessionID,
      },
      "Suspicious activity: session accessed from different IP"
    );
  }
  next();
});

// Idle timeout middleware (30 mins)
app.use((req, res, next) => {
  if (req.session) {
    const now = Date.now();
    if (
      req.session.lastActive &&
      now - req.session.lastActive > 30 * 60 * 1000
    ) {
      logger.info("[Session] Destroying idle session:", req.sessionID);
      return req.session.destroy((err) => {
        if (err)
          logger.error({ err: err.message }, "Error destroying idle session");
        return res
          .status(401)
          .json({ error: "Session expired due to inactivity" });
      });
    }
    req.session.lastActive = now;
  }
  next();
});
// Track app activity for smart notification frequency adjustment
app.use((req, res, next) => {
  if (req.studentUser || req.adminSession) {
    const userId = req.studentUser?.id || req.adminSession?.userId;
    if (userId) notificationAnalyticsRepository.trackAppActivity(userId);
  }
  next();
});

// CSRF protection â€” double-submit cookie pattern for all state-changing endpoints
app.use(csrfProtection);

// Global API rate limiter â€” protects all /api routes from request flooding
app.use("/api", apiRateLimiter);

const adminAuth = adminAuthMiddleware.requireAdmin;
const adminEvents = new EventEmitter();
adminEvents.on("CORE_TEAM_MEMBER_ADDED", (event) =>
  console.log(`[EVENT] CORE_TEAM_MEMBER_ADDED:`, event)
);
adminEvents.on("CORE_TEAM_MEMBER_REMOVED", (event) =>
  console.log(`[EVENT] CORE_TEAM_MEMBER_REMOVED:`, event)
);
// Read-only guard — blocks non-GET requests when system is in maintenance mode
app.use(readOnlyGuard);

// ── NexaSphere Canonical API v1 ───────────────────────────────────
app.use("/api/v1", apiV1Router);

// Mount route modules
app.use("/api/form-submissions", formSubmissionsRouter);
app.post("/api/analytics/track", logEvent);
app.use("/api/monitoring", monitoringRouter);
app.use("/api/health-dashboard", healthDashboardRouter);
app.use("/api", documentationRouter);
app.use("/", apiRouter);
app.use("/", healthRouter);
app.use("/", coreTeamRouter);
// Compliance & Legal Documents (handles both public and admin routes internally)
// Mounted early to prevent wildcard root routes ('/') from stealing the requests
app.use("/api/compliance", complianceRouter);

app.use("/api", formsRouter);
app.use("/api", portfolioRouter);
app.use("/api", userGroupsRouter);
app.use("/", notificationsRouter);
app.use("/api", recoveryRouter);
app.use("/api", notificationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api", learningPathRouter);
app.use("/api/feedback", feedbackRouter);

// Admin Specific Routes
const adminAuthRateLimited = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

// Scheduled Tasks Management
app.use(
  "/api/admin/scheduled-tasks",
  adminAuthRateLimited,
  scheduledTasksRouter
);

// Database Backup & Recovery Endpoints
app.get(
  "/api/admin/backups",
  adminAuthRateLimited,
  backupController.getBackups
);
app.post(
  "/api/admin/backups/manual",
  adminAuthRateLimited,
  backupController.runManualBackup
);
app.post(
  "/api/admin/backups/restore",
  adminAuthRateLimited,
  backupController.runRestore
);
app.get(
  "/api/admin/backups/restore-test-history",
  adminAuthRateLimited,
  backupController.getRestoreHistory
);
app.delete(
  "/api/admin/backups",
  adminAuthRateLimited,
  backupController.deleteBackup
);

const defaultContent = {
  events: [
    {
      id: "kss-153",
      name: "KSS #153 â€” Knowledge Sharing Session",
      shortName: "KSS #153",
      date: "March 14, 2025",
      description:
        "NexaSphere's inaugural Knowledge Sharing Session focused on the impact of AI.",
      status: "completed",
      icon: "Brain",
      tags: ["AI", "Learning", "Community"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  activityEvents: {},
  coreTeam: [],
};

// â”€â”€ File Upload Configuration â”€â”€
import webhooksRouter from "./routes/webhooks.js";
app.use("/api/webhooks", webhooksRouter);
app.use("/api/admin/scheduled-tasks", adminAuth, scheduledTasksRouter);
app.use("/api/admin/segments", adminAuth, segmentsRouter);
app.use("/api/moderation", adminAuth, moderationRouter);
app.use("/api/admin/rbac", adminAuth, rbacRouter);

app.get("/api/admin/backups", adminAuth, backupController.getBackups);
app.post(
  "/api/admin/backups/manual",
  validate(indexSchemas.manualBackupSchema),
  adminAuth,
  backupController.runManualBackup
);
app.post(
  "/api/admin/backups/restore",
  validate(indexSchemas.restoreBackupSchema),
  adminAuth,
  backupController.runRestore
);
app.get(
  "/api/admin/backups/restore-test-history",
  adminAuth,
  backupController.getRestoreHistory
);
app.delete(
  "/api/admin/backups",
  validate(indexSchemas.deleteBackupSchema),
  adminAuth,
  backupController.deleteBackup
);
app.use(apiKeysRouter);

// Root Level Routers (Keep at the bottom of route stack)
app.use("/", dashboardRouter);
app.use("/", announcementsRouter);
app.use("/", syncRouter);

// ── File Upload Configuration ──
const UPLOADS_DIR = path.join(__dirname, "uploads");
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (_) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || "";
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const MAGIC_BYTES = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/gif": [[0x47, 0x49, 0x46]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "application/zip": [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
  ],
  "application/x-zip-compressed": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "text/plain": [],
  "text/markdown": [],
  "application/json": [],
};

function validateMagicBytes(filepath, mimeType) {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures || signatures.length === 0) return true;
  const fd = fs.openSync(filepath, "r");
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE);
  await fsp.mkdir(dir, { recursive: true });
  try {
    await fsp.access(CONTENT_FILE);
  } catch {
    await fsp.writeFile(
      CONTENT_FILE,
      JSON.stringify(defaultContent, null, 2),
      "utf8"
    );
  }
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Compliance & Accessibility Audit Tools (#1801)
app.use("/api", auditToolsRouter);

async function runWithFileLock(callback) {
  return await fileMutex.runExclusive(callback);
}

async function readContent() {
  await ensureContentFile();
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  if (!raw || !raw.trim()) {
    return { ...defaultContent };
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(
      "[readContent] Failed to parse content file, falling back to defaults:",
      err.message
    );
    return { ...defaultContent };
  }
}

async function writeContent(content) {
  await ensureContentFile();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}

let contentLock = Promise.resolve();

function withContentLock(fn) {
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });
  const current = contentLock;
  contentLock = next;
  return current.then(() => fn()).finally(() => release());
}

app.get("/healthz", async (req, res) => {
  try {
    const events = await listEventsStore();
    res.json({
      ok: true,
      events: events.length,
      storage: HAS_SUPABASE ? "supabase" : "file",
    });
  } catch (e) {
    res.status(503).json({
      ok: false,
      error: e?.message || "Health check failed",
      storage: HAS_SUPABASE ? "supabase" : "file",
    });
  }
});

app.get("/api/content/events", async (req, res) => {
  try {
    return res.json({ events: await listEventsStore() });
  } catch (e) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to load events" });
  }
});

app.get("/api/content/activity-events/:activityKey", async (req, res) => {
  try {
    const activityKey = toSafeString(req.params.activityKey, 80);
    return res.json({ events: await listActivityEventsStore(activityKey) });
  } catch (e) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to load activity events" });
  }
});

app.post("/api/content/activity-events/:activityKey", async (req, res) => {
  try {
    const activityKey = toSafeString(req.params.activityKey, 80);
    const body = req.body || {};
    const auth = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
    };
    if (!(await canManageActivityEvent(auth))) {
      return res.status(401).json({
        error: "Unauthorized. Core team details or password did not match.",
      });
    }

    const event = {
      id: `manual-${Date.now()}`,
      name: toSafeString(body.eventName, 120),
      date: toSafeString(body.eventDate, 80),
      tagline: toSafeString(body.eventTagline, 240),
      description: toSafeString(body.eventDescription, 1200),
      status: "completed",
      createdAt: new Date().toISOString(),
      createdBy: {
        name: toSafeString(body.name, 120),
        email: toSafeString(body.email, 140),
        phone: normalizePhone(body.phone),
      },
    };
    if (!event.name || !event.date || !event.description) {
      return res
        .status(400)
        .json({ error: "Event name, date and description are required." });
    }

    await createActivityEventStore(activityKey, event);
    return res.status(201).json({ ok: true, event });
  } catch (e) {
    return res
      .status(500)
      .json({ error: e?.message || "Unable to add activity event" });
  }
});

app.delete(
  "/api/content/activity-events/:activityKey/:eventId",
  async (req, res) => {
    try {
      const activityKey = toSafeString(req.params.activityKey, 80);
      const eventId = toSafeString(req.params.eventId, 120);
      const body = req.body || {};
      const auth = {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
      };
      if (!(await canManageActivityEvent(auth))) {
        return res.status(401).json({
          error: "Unauthorized. Core team details or password did not match.",
        });
      }

      const deleted = await deleteActivityEventStore(activityKey, eventId);
      if (!deleted)
        return res
          .status(404)
          .json({ error: "Event not found in manual activity events." });
      return res.json({ ok: true });
    } catch (e) {
      return res
        .status(500)
        .json({ error: e?.message || "Unable to delete activity event" });
    }
  }
);

app.post("/api/admin/login", authRateLimiter, adminAuthMiddleware.login);
app.post("/api/admin/logout", adminAuthMiddleware.logout);
app.use("/api/admin/analytics", adminAuth, analyticsRouter);
app.use("/api/admin/metrics", adminAuth, adminStreamRouter);

app.get("/api/auth/google", studentAuthController.googleAuth);
app.get("/api/auth/google/callback", studentAuthController.googleCallback);
app.get("/api/auth/github", studentAuthController.githubAuth);
app.get("/api/auth/github/callback", studentAuthController.githubCallback);
app.get(
  "/api/auth/github/portfolio",
  studentAuthController.githubPortfolioAuth
);
app.get(
  "/api/auth/github/portfolio/callback",
  studentAuthController.githubPortfolioCallback
);
app.get("/api/auth/me", requireStudentAuth, studentAuthController.getMe);
app.post(
  "/api/auth/theme",
  requireStudentAuth,
  studentAuthController.updateTheme
);

// Student Profile Endpoints
app.get(
  "/api/auth/profile",
  requireStudentAuth,
  studentAuthController.getProfile
);
app.put(
  "/api/auth/profile",
  requireStudentAuth,
  studentAuthController.updateProfile
);
app.get(
  "/api/auth/registrations",
  requireStudentAuth,
  studentAuthController.getRegistrations
);
app.post("/api/auth/logout", studentAuthController.logout);

// Slack Integration Endpoints
app.post(
  "/api/auth/slack-settings",
  requireStudentAuth,
  studentAuthController.updateSlackSettings
);
app.get("/api/slack/auth", slackController.startSlackAuth);
app.get("/api/slack/auth/callback", slackController.slackAuthCallback);
app.post(
  "/api/slack/commands",
  express.urlencoded({ extended: true }),
  slackController.handleSlackCommand
);
app.get("/api/admin/slack/config", adminAuth, slackController.getSlackConfig);
app.post(
  "/api/admin/slack/config",
  adminAuth,
  slackController.updateSlackConfig
);
app.delete(
  "/api/admin/slack/disconnect",
  adminAuth,
  slackController.disconnectSlack
);

// â”€â”€ Event Admin Management â”€â”€
app.get("/api/admin/events", adminAuth, eventsController.adminListEvents);
app.post("/api/admin/events", adminAuth, eventsController.adminCreateEvent);
app.put("/api/admin/events/:id", adminAuth, eventsController.adminUpdateEvent);
app.delete(
  "/api/admin/events/:id",
  adminAuth,
  eventsController.adminDeleteEvent
);

// Live Streaming
app.get("/api/streams", streamController.listStreams);
app.get("/api/streams/event/:eventId", streamController.getStreamByEvent);
app.get("/api/streams/:id", streamController.getStream);
app.post("/api/streams", adminAuth, streamController.createStream);
app.put("/api/streams/:id", adminAuth, streamController.updateStream);
app.patch(
  "/api/streams/:id/status",
  adminAuth,
  streamController.setStreamStatus
);
app.delete("/api/streams/:id", adminAuth, streamController.deleteStream);
app.post(
  "/api/streams/:id/chat",
  apiRateLimiter,
  streamController.addChatMessage
);
app.get("/api/streams/:id/chat", streamController.listChatMessages);
app.post("/api/streams/:id/ban", adminAuth, streamController.banUser);
app.post("/api/streams/:id/polls", adminAuth, streamController.createPoll);
app.get("/api/streams/:id/polls", streamController.listPolls);
app.post("/api/streams/polls/:pollId/vote", streamController.votePoll);
app.patch(
  "/api/streams/polls/:pollId/close",
  adminAuth,
  streamController.closePoll
);
app.patch(
  "/api/streams/chat/:messageId/moderate",
  adminAuth,
  streamController.moderateChatMessage
);
app.get("/api/admin/streams", adminAuth, streamController.adminListAll);
app.post(
  "/api/streams/:id/mod-chat",
  adminAuth,
  streamController.addModChatMessage
);
app.get(
  "/api/streams/:id/mod-chat",
  adminAuth,
  streamController.listModChatMessages
);
app.get(
  "/api/streams/:id/analytics",
  adminAuth,
  streamController.getStreamAnalytics
);

// Streaming Engagement: Q&A and Reactions
app.post("/api/streams/:id/questions", streamController.addQuestion);
app.get("/api/streams/:id/questions", streamController.listQuestions);
app.patch(
  "/api/streams/questions/:qId/answer",
  adminAuth,
  streamController.answerQuestion
);
app.post("/api/streams/:id/reactions", streamController.addReaction);
app.get("/api/streams/:id/reactions", streamController.getReactions);

// Public listings
app.get("/api/content/team", async (req, res) => {
  try {
    const fullTeam = await listCoreTeamStore();
    const publicTeam = fullTeam.map(
      ({ email, whatsapp, ...safeData }) => safeData
    );
    return res.json(publicTeam);
  } catch (e) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to load core team" });
  }
});

// Admin Team Management
app.get(
  "/api/admin/core-team",
  adminAuthMiddleware.requireScope("settings:admin"),
  coreTeamController.adminListCoreTeamMembers
);
app.post(
  "/api/admin/core-team",
  adminAuthMiddleware.requireScope("settings:admin"),
  coreTeamController.adminAddCoreTeamMember
);
app.put(
  "/api/admin/core-team/:id",
  adminAuthMiddleware.requireScope("settings:admin"),
  coreTeamController.adminUpdateCoreTeamMember
);
app.delete(
  "/api/admin/core-team/:id",
  adminAuthMiddleware.requireScope("settings:admin"),
  coreTeamController.adminDeleteCoreTeamMember
);

app.get("/api/admin/membership", adminAuth, async (req, res) => {
  const scriptUrl = process.env.MEMBERSHIP_SCRIPT_URL;
  const secret = process.env.MEMBERSHIP_SECRET;

  if (!scriptUrl || !secret) {
    return res.json({ responses: [] });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getResponses", token: secret }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned ${response.status}`);
    }

    const data = await response.json();
    return res.json({ responses: data.responses || [] });
  } catch (err) {
    logger.error({ err: err.message }, "Failed to fetch membership responses");
    return res
      .status(500)
      .json({ error: "Failed to fetch membership responses" });
  }
});

async function handleForm(formType, req, res) {
  try {
    const payload = normalizeFormSubmission(formType, req.body || {});

    const savedToSupabase = await appendToSupabaseForms(formType, payload);
    try {
      await appendFormToSheet(formType, payload);
    } catch (sheetErr) {
      if (!savedToSupabase) throw sheetErr;
    }

    // NEW: Send a welcome email to the user
    try {
      const verifyUrl = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/verify?email=${encodeURIComponent(req.body.collegeEmail)}`;
      await sendWelcomeVerificationEmail(
        req.body.collegeEmail,
        req.body.fullName,
        verifyUrl
      );
    } catch (emailErr) {
      logger.error(
        { err: emailErr },
        "Failed to send welcome email in form handler"
      );
      // We don't fail the whole request if email fails, but we log it.
    }

    // NEW: Real-time notification and metrics updates
    try {
      broadcastSSEEvent("registration", {
        formType,
        fullName: payload.fullName,
        timestamp: new Date().toISOString(),
      });
      emitToRoom(getRoom("admin"), "admin:new-registration", {
        formType,
        userName: payload.fullName,
        timestamp: new Date(),
      });
    } catch (realtimeErr) {
      logger.error(
        { err: realtimeErr },
        "Failed to broadcast real-time updates in form handler"
      );
    }

    return res.json({ ok: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json({
        error: "Invalid form submission",
        issues: e.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return res.status(500).json({ error: e?.message || "Submission failed" });
  }
}

app.post("/api/forms/membership", formRateLimiter, (req, res) =>
  handleForm("membership", req, res)
);
app.post("/api/forms/recruitment", formRateLimiter, (req, res) =>
  handleForm("recruitment", req, res)
);
app.post("/api/core-team/apply", formRateLimiter, (req, res) =>
  handleForm("core_team", req, res)
);
// Real-time notification subscriber channels
const pushSubscriptions = new Set();

// Server-side notifications API (simple in-memory store)

app.get(
  "/api/notifications",
  adminAuth,
  notificationRateLimiter,
  (req, res) => {
    try {
      // If user id provided via query or auth, use that; otherwise global
      const userId = req.query.userId || "global";
      const list = notificationsService.getNotifications(userId);
      return res.json({ notifications: list });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

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
      return res.status(400).json({
        error: "Invalid subscription payload",
        details: errors.array(),
      });
    }

    const {
      endpoint,
      keys: { p256dh, auth },
    } = req.body.subscription;
    req.body.subscription = { endpoint, keys: { p256dh, auth } };

    next();
  },
];

app.post(
  "/api/notifications/subscribe",
  adminAuth,
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
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  "/api/notifications/unsubscribe",
  adminAuth,
  notificationRateLimiter,
  validatePushSubscription,
  async (req, res) => {
    try {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.delete(JSON.stringify(subscription));
        await removePersistedPushSubscription(subscription);
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const ADMIN_IDLE_TIMEOUT_MS = parsePositiveInt(
  process.env.ADMIN_IDLE_TIMEOUT_MS,
  30 * 60 * 1000
);

function resolveSession(req) {
  return (
    req.cookies?.ns_admin_token ||
    (req.headers.cookie
      ? req.headers.cookie.split(";").reduce((acc, c) => {
          const [k, v] = c.trim().split("=");
          return k === "ns_admin_token" ? v : acc;
        }, null)
      : null) ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : "")
  );
}

function sessionMiddleware(req, res, next) {
  const token = resolveSession(req);
  if (!token) {
    return next();
  }
  getAdminSession(token)
    .then((session) => {
      if (!session) {
        return next();
      }
      const lastSeen = session.last_seen_at
        ? new Date(session.last_seen_at).getTime()
        : 0;
      if (lastSeen && Date.now() - lastSeen > ADMIN_IDLE_TIMEOUT_MS) {
        return next();
      }
      req.adminSession = session;
      next();
    })
    .catch(() => next());
}

function requireNotificationAuth(req, res, next) {
  if (req.adminSession) {
    return next();
  }
  requireStudentAuth(req, res, (err) => {
    if (!err && req.studentUser) {
      return next();
    }
    return res
      .status(401)
      .json({ error: "Unauthorized: Authentication required" });
  });
}

app.post(
  "/api/notifications/mark-read",
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { id, userId } = req.body || {};
      if (!id) return res.status(400).json({ error: "id required" });
      let uid = userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return res.status(403).json({
            error: "Forbidden: Cannot modify other users notifications",
          });
        }
        uid = studentId;
      }
      const ok = await notificationsService.markAsRead(uid, id);
      return res.json({ success: ok });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.post(
  "/api/notifications/mark-all-read",
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId } = req.body || {};
      let uid = userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        uid = studentId;
      }
      await notificationsService.markAllAsRead(uid);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.delete(
  "/api/notifications/:id",
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const id = req.params.id;
      let uid = req.query.userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (req.query.userId && req.query.userId !== studentId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        uid = studentId;
      }
      const removed = await notificationsService.removeNotification(uid, id);
      if (!removed)
        return res.status(404).json({ error: "Notification not found" });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.delete(
  "/api/notifications",
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      let uid = req.query.userId || "global";
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (req.query.userId && req.query.userId !== studentId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        uid = studentId;
      }
      await notificationsService.clearAll(uid);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Create notification (admin/testing)
app.post("/api/notifications", (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body || {};
    const note = notificationsService.addNotification(userId || "global", {
      title,
      message,
      type,
      link,
    });
    return res.json({ success: true, notification: note });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Portfolio System API Endpoints
app.get("/api/portfolio/:username", async (req, res) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const portfolio = await portfolioRepository.getByUsername(username);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    return res.json(portfolio);
  } catch (err) {
    logger.error({ err: err.message }, "Error fetching portfolio");
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
    return res.status(500).json({ error: err.message });
  }
});

// Notification analytics (lightweight collector)
app.post("/api/notifications/analytics", async (req, res) => {
  try {
    const event = req.body || {};
    // Minimal validation â€” in future route can forward to analytics pipeline
    console.log("[notification-analytics]", event.type || "unknown", event);
    return res.json({ ok: true });
    logger.info("[notification-analytics]", event.type || "unknown", event);
    return sendSuccess(res, { ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/portfolio", portfolioRateLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const username = String(body.username || "").trim();
    const passkey = String(body.passkey || "").trim();
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    if (!username || username.length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters long" });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        error:
          "Username can only contain alphanumeric characters, underscores, and hyphens",
      });
    }
    if (!passkey || passkey.length < 12) {
      return res
        .status(400)
        .json({ error: "Passkey must be at least 12 characters long" });
    }

    // Check lockout before verifying
    const lockout = checkPasskeyLockout(username, ip);
    if (lockout) {
      return res.status(429).json({
        error: "Too many failed passkey attempts. Please try again later.",
      });
    }

    // Verify ownership/passkey
    const isAuthorized = await portfolioRepository.verifyPasskey(
      username,
      passkey
    );
    if (!isAuthorized) {
      recordFailedPasskeyAttempt(username, ip);
      return res
        .status(401)
        .json({ error: "Incorrect passkey for this username" });
    }

    clearPasskeyAttempts(username, ip);

    // Save portfolio configuration
    const saved = await portfolioRepository.createOrUpdate(body);
    return res.json({ ok: true, portfolio: saved });
  } catch (err) {
    logger.error({ err: err.message }, "Error saving portfolio");
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

// â”€â”€ Forum / Q&A â”€â”€
app.get("/api/forum/categories", forumController.listCategories);
app.get("/api/forum/threads", forumController.listThreads);
app.get("/api/forum/threads/:id", forumController.getThread);
app.post(
  "/api/forum/threads",
  requireStudentAuth,
  forumController.createThread
);
app.put(
  "/api/forum/threads/:id",
  requireStudentAuth,
  forumController.updateThread
);
app.delete(
  "/api/forum/threads/:id",
  requireStudentAuth,
  forumController.deleteThread
);
app.get("/api/forum/threads/:id/replies", forumController.listReplies);
app.post(
  "/api/forum/threads/:id/replies",
  requireStudentAuth,
  forumController.createReply
);
app.put(
  "/api/forum/replies/:replyId",
  requireStudentAuth,
  forumController.updateReply
);
app.delete(
  "/api/forum/replies/:replyId",
  requireStudentAuth,
  forumController.deleteReply
);
app.post(
  "/api/forum/threads/:id/vote",
  requireStudentAuth,
  forumController.voteThread
);
app.post(
  "/api/forum/replies/:replyId/vote",
  requireStudentAuth,
  forumController.voteReply
);
app.post(
  "/api/forum/threads/:id/accept/:replyId",
  requireStudentAuth,
  forumController.acceptReply
);
app.patch(
  "/api/admin/forum/threads/:id/moderate",
  adminAuth,
  forumController.moderateThread
);
app.patch(
  "/api/admin/forum/replies/:replyId/moderate",
  adminAuth,
  forumController.moderateReply
);
app.get(
  "/api/admin/forum/threads",
  adminAuth,
  forumController.adminListThreads
);

// â”€â”€ Mentorship & Buddy System â”€â”€
app.get("/api/mentorship/mentors", mentorshipController.listMentors);
app.get("/api/mentorship/mentors/:id", mentorshipController.getMentor);
app.post(
  "/api/mentorship/mentors",
  requireStudentAuth,
  mentorshipController.registerMentor
);
app.put(
  "/api/mentorship/mentors/:id",
  requireMentorshipAuth,
  mentorshipController.updateMentor
);
app.post(
  "/api/mentorship/requests",
  requireStudentAuth,
  mentorshipController.requestMentorship
);
app.get(
  "/api/mentorship/requests",
  requireMentorshipAuth,
  mentorshipController.listMentorships
);
app.get(
  "/api/mentorship/requests/:id",
  requireMentorshipAuth,
  mentorshipController.getMentorship
);
app.put(
  "/api/mentorship/requests/:id/status",
  requireMentorshipAuth,
  mentorshipController.updateMentorshipStatus
);
app.post(
  "/api/mentorship/requests/:id/sessions",
  requireStudentAuth,
  mentorshipController.logSession
);
app.get(
  "/api/mentorship/requests/:id/sessions",
  requireStudentAuth,
  mentorshipController.listSessions
);
app.post(
  "/api/mentorship/buddy-pairs",
  requireStudentAuth,
  mentorshipController.createBuddyPair
);
app.get(
  "/api/mentorship/buddy-pairs",
  requireStudentAuth,
  mentorshipController.listBuddyPairs
);
app.get("/api/admin/mentorships", adminAuth, mentorshipController.adminListAll);
app.get("/api/admin/mentors", adminAuth, mentorshipController.adminListMentors);

// â”€â”€ Search, Discovery & Recommendation Engine â”€â”€
app.get("/api/search", searchRateLimiter, searchController.search);
app.get("/api/search/trending", searchRateLimiter, searchController.trending);
app.get(
  "/api/recommendations",
  searchRateLimiter,
  searchController.recommendations
);
// â”€â”€ Resource Library Routes â”€â”€
// Public resource endpoints
app.get("/api/resources", resourcesController.listResources);
app.get("/api/resources/:id", resourcesController.getResource);
app.post("/api/resources", resourcesController.createResource);
app.post("/api/resources/:id/vote", resourcesController.voteResource);
app.post("/api/resources/:id/download", resourcesController.downloadResource);
app.post(
  "/api/resources/:id/download-track",
  resourcesController.downloadResource
);

// Student resource upload (authenticated)
app.post(
  "/api/resources/upload",
  requireStudentAuth,
  uploadWithMagicCheck,
  resourcesController.uploadFile
);

// Admin resource management
app.get("/api/admin/resources", adminAuth, resourcesController.listResources);
app.post("/api/admin/resources", adminAuth, resourcesController.createResource);
app.put(
  "/api/admin/resources/:id",
  adminAuth,
  resourcesController.updateResource
);
app.delete(
  "/api/admin/resources/:id",
  adminAuth,
  resourcesController.deleteResource
);
app.patch(
  "/api/admin/resources/:id/moderate",
  adminAuth,
  resourcesController.moderateResource
);
// Must be registered after all routes.
app.use(notFoundHandler);
addSentryErrorHandler(app);
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  logger.error(
    { reason: reason instanceof Error ? reason.message : String(reason) },
    "[Process] Unhandled rejection"
  );
});

process.on("uncaughtException", (err) => {
  console.error(
    "[Process] Uncaught exception:",
    err instanceof Error ? err.message : err
  );
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});

const port = Number(process.env.PORT || 8787);
let server;

if (process.env.NODE_ENV !== "test") {
  if (!process.env.VERCEL) {
    const boot = HAS_SUPABASE
      ? studentUsersRepository.ensureSchema()
      : ensureContentFile();
    boot.then(() => {
      server = app.listen(port, () => {
        console.log(`NexaSphere server listening on http://localhost:${port}`);
      });
    });
  } else {
    loadPersistedPushSubscriptions();
    server = app.listen(port, () => {
      console.log(`NexaSphere server listening on http://localhost:${port}`);
    });
    initializeSocketIO(server);
  }
}

export default app;
