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
import { initializeSocketIO } from "./config/socket.js";
import adminStreamRouter from "./routes/adminStream.js";
import documentationRouter from "./routes/documentation.js";
import monitoringRouter from "./routes/monitoring.js";
import healthRouter from "./routes/health.js";
import coreTeamRouter from "./routes/coreTeam.js";

import "./workers/reminderWorker.js";
import portfolioExportRouter from "./routes/portfolioExport.js";
import userGroupsRouter from "./routes/userGroups.js";
import notificationsRouter from "./routes/notifications.js";
import adminRouter from "./routes/admin.js";
import announcementsRouter from "./routes/announcements.js";
import bulkRouter from "./routes/bulk.js";
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
import * as mentorshipController from "./controllers/mentorshipController.js";
import { xssSanitizer } from "./middleware/xssSanitizer.js";
import { tierRateLimiter } from "./middleware/tierRateLimiter.js";
import { startWebhookRetryProcessor } from "./services/webhookRetryProcessor.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";
import compression from "compression";
import morgan from "morgan";
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

import activityTimelineRoutes from "./routes/activityTimeline.js";

import moderationRouter from "./routes/moderation.js";
import rbacRouter from "./routes/rbac.js";
import { startStreamingWorkers } from "./streaming/startStreamingWorkers.js";
import {
  listEventsStore,
  createEventStore,
  updateEventStore,
  deleteEventStore,
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
  sanitizeEvent,
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

import { broadcastSSEEvent } from "./services/sseService.js";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, "data", "content.json");

validateEnvironment();

function requiredStrongPassword(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  if (value.length < 12 || !hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    throw new Error(
      `${name} must be at least 12 characters and include uppercase, lowercase, number, and symbol`
    );
  }
  return value;
}
const ADMIN_EVENT_PASSWORD = requiredStrongPassword("ADMIN_EVENT_PASSWORD");
const SESSION_SECRET = requiredStrongPassword("SESSION_SECRET");
const ADMIN_PASSWORD = requiredStrongPassword("ADMIN_PASSWORD");

const app = express();
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

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(xssSanitizer);

app.use(apiLogger);
app.use(performanceMonitor);
app.use(cookieParser());

// Verify Redis URL protocol in production
const redisSessionUrl = process.env.REDIS_URL || "";
if (
  process.env.NODE_ENV === "production" &&
  !redisSessionUrl.startsWith("rediss://")
) {
  console.warn(
    "Security Warning: Redis URL should use rediss:// for TLS in production."
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
    console.warn(
      "[Session] Suspicious activity: Session accessed from different IP. Original:",
      req.session.ip,
      "New:",
      req.ip || req.connection?.remoteAddress
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
      req.session.destroy((err) => {
        if (err) console.error("[Session] Error destroying idle session:", err);
        return res
          .status(401)
          .json({ error: "Session expired due to inactivity" });
      });
      return;
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

const adminEvents = new EventEmitter();
adminEvents.on("CORE_TEAM_MEMBER_ADDED", (event) =>
  console.log(`[EVENT] CORE_TEAM_MEMBER_ADDED:`, event)
);
adminEvents.on("CORE_TEAM_MEMBER_REMOVED", (event) =>
  console.log(`[EVENT] CORE_TEAM_MEMBER_REMOVED:`, event)
);
// Read-only guard — blocks non-GET requests when system is in maintenance mode
app.use(readOnlyGuard);

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
const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

// Scheduled Tasks Management
app.use("/api/admin/scheduled-tasks", adminAuth, scheduledTasksRouter);

// Database Backup & Recovery Endpoints
app.get("/api/admin/backups", adminAuth, backupController.getBackups);
app.post(
  "/api/admin/backups/manual",
  adminAuth,
  backupController.runManualBackup
);
app.post("/api/admin/backups/restore", adminAuth, backupController.runRestore);
app.get(
  "/api/admin/backups/restore-test-history",
  adminAuth,
  backupController.getRestoreHistory
);
app.delete("/api/admin/backups", adminAuth, backupController.deleteBackup);

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

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function normalizePrivateKey(k) {
  return k.includes("\\n") ? k.replace(/\\n/g, "\n") : k;
}
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
app.use("/", apiRouter);
app.use("/", healthRouter);
app.use("/", coreTeamRouter);
app.use("/", announcementsRouter);
app.use("/", notificationsRouter);
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
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(
      CONTENT_FILE,
      JSON.stringify(defaultContent, null, 2),
      "utf8"
    );
  }
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Compliance & Accessibility Audit Tools (#1801)
// Must be registered after all routes.
app.use(notFoundHandler);
addSentryErrorHandler(app);
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  console.error(
    "[Process] Unhandled rejection:",
    reason instanceof Error ? reason.message : reason
  );
});

const port = Number(process.env.PORT || 8787);
let server;

if (process.env.NODE_ENV !== "test") {
  if (!process.env.VERCEL) {
    const boot = HAS_SUPABASE
      ? Promise.all([
          studentUsersRepository.ensureSchema(),
          slackRepository.ensureSchema(),
        ])
      : ensureContentFile();
    boot.then(() => {
      loadPersistedPushSubscriptions();
      slackIntegrationService.init();
      server = app.listen(port, () => {
        logger.info(`NexaSphere server listening on http://localhost:${port}`);
        schedulerService.init();
        startWebhookRetryProcessor();
      });
      server.on("error", (err) => {
        console.error("SERVER LISTEN ERROR:", err.code, err.message);
      });
      initializeSocketIO(server);
    });
  } else {
    // Vercel/Render style deployments rely on the platform to start the server.
    server = app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`NexaSphere server listening on http://localhost:${port}`);
    });
    initializeSocketIO(server);
  }
}

export default app;
