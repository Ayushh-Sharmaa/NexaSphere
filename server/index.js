import "dotenv/config";
import { initObservability } from "./observability/index.js";
import { setTraceIdResolver } from "./utils/logContext.js";
import { getActiveTraceId } from "./observability/tracing.js";
import helmet from "helmet";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs, { promises as fsp } from "fs";
import { body, validationResult } from "express-validator";
import { EventEmitter } from "events";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { adminAuthMiddleware } from "./middleware/adminAuthMiddleware.js";
import analyticsRouter from "./routes/analytics.js";
import apiRouter from "./routes/api.js";
import { initializeSocketIO, emitToRoom, getRoom } from "./config/socket.js";
import adminStreamRouter from "./routes/adminStream.js";
import documentationRouter from "./routes/documentation.js";
import monitoringRouter from "./routes/monitoring.js";
import healthRouter from "./routes/health.js";
import coreTeamRouter from "./routes/coreTeam.js";
import formsRouter from "./routes/forms.js";
import portfolioRouter from "./routes/portfolio.js";
import notificationsRouter from "./routes/notifications.js";
import adminRouter from "./routes/admin.js";
import { validateEnvironment } from "./utils/envValidator.js";
import { performanceMonitor } from "./middleware/performanceMonitor.js";
import { tracingMiddleware } from "./middleware/tracingMiddleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { initializeSentry, addSentryErrorHandler } from "./utils/sentry.js";
import {
  apiRateLimiter,
  formRateLimiter,
  notificationRateLimiter,
  activityAuthRateLimiter,
  portfolioRateLimiter,
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
import { pushSubscriptionsRepository } from "./repositories/pushSubscriptionsRepository.js";
import { Mutex } from "async-mutex";
import {
  CircuitBreaker,
  circuitBreakerRegistry,
} from "./utils/circuitBreaker.js";
import { getPublicAppUrl } from "./utils/publicAppUrl.js";
import * as eventsController from "./controllers/eventsController.js";
import * as activityEventsController from "./controllers/activityEventsController.js";
import * as streamController from "./controllers/streamController.js";
import * as coreTeamController from "./controllers/coreTeamController.js";
import * as formsController from "./controllers/formsController.js";
import { eventsService } from "./services/eventsService.js";
import { coreTeamService } from "./services/coreTeamService.js";
import notificationsService from "./services/notificationsService.js";
import { notificationPreferencesRepository } from "./repositories/notificationPreferencesRepository.js";
import { HAS_SUPABASE } from "./storage/supabaseClient.js";
import cookieParser from "cookie-parser";
import passport from "./config/studentOAuth.js";
import { studentUsersRepository } from "./repositories/studentUsersRepository.js";
import * as studentAuthController from "./controllers/studentAuthController.js";
import * as forumController from "./controllers/forumController.js";
import { requireStudentAuth } from "./middleware/studentAuthMiddleware.js";
import { studentAuthService } from "./services/studentAuthService.js";
import * as mentorshipController from "./controllers/mentorshipController.js";
import { xssSanitizer } from "./middleware/xssSanitizer.js";
import { tierRateLimiter } from "./middleware/tierRateLimiter.js";
import compression from "compression";
import syncRouter from "./routes/sync.js";
import multer from "multer";
import * as resourcesController from "./controllers/resourcesController.js";

validateLimiters();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, "data", "content.json");

validateEnvironment();

const app = express();

setTraceIdResolver(getActiveTraceId);
initObservability(app);

const useStructuredHttpLog =
  (process.env.LOG_FORMAT || "").toLowerCase() === "json";

// Trust the first reverse proxy hop (e.g., Vercel, Render, Nginx, Cloudflare)
// to correctly populate req.ip and securely discard spoofed X-Forwarded-For headers
const proxyTrust = process.env.TRUST_PROXY || 1;
app.set(
  "trust proxy",
  proxyTrust === "true"
    ? true
    : proxyTrust === "false"
      ? false
      : !isNaN(proxyTrust)
        ? parseInt(proxyTrust, 10)
        : proxyTrust
);

initializeSentry(app);
app.use(compression());

if (!process.env.CORS_ORIGIN) {
  throw new Error("CORS_ORIGIN environment variable must be set.");
}

const allowedOrigins = process.env.CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

    // Disable old IE XSS filter
    xssFilter: false,

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
        // Default restriction
        defaultSrc: ["'self'"],

        // Prevent inline scripts + third-party execution
        scriptSrc: ["'self'", "https://challenges.cloudflare.com"],

        // Allow styles from self only
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

        // Images
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "https://api.dicebear.com",
          "https://images.unsplash.com",
        ],

        // Fonts
        fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],

        // API/WebSocket connections
        connectSrc: [
          "'self'",
          "https:",
          "wss:",
          "https://challenges.cloudflare.com",
          "https://*.ingest.sentry.io",
          "https://*.ingest.us.sentry.io",
          process.env.FRONTEND_URL || "http://localhost:5173",
          `wss://${process.env.DOMAIN || "localhost"}`,
        ],

        // Block Flash/object/embed
        objectSrc: ["'none'"],

        // Prevent <base> hijacking
        baseUri: ["'self'"],

        // Prevent iframe embedding
        frameAncestors: ["'none'"],

        // Restrict forms
        formAction: ["'self'"],

        // Prevent mixed content
        upgradeInsecureRequests: [],

        // Restrict workers
        workerSrc: ["'self'", "blob:"],

        // Restrict manifests
        manifestSrc: ["'self'"],

        // Restrict media
        mediaSrc: ["'self'"],

        // Restrict frames
        frameSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://maps.google.com",
        ],

        // Restrict child browsing contexts
        childSrc: ["'none'"],
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
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
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

app.use(tracingMiddleware);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(xssSanitizer);
if (!useStructuredHttpLog) {
  app.use(morgan("combined"));
}
app.use(performanceMonitor);
app.use(cookieParser());

// Global API rate limiter — protects all /api routes from request flooding
app.use("/api", apiRateLimiter);
app.use("/api", tierRateLimiter());

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, path, reqId } = req;

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const prefix = reqId ? `[${reqId}] ` : "";
    const message = `${prefix}[${method}] ${path} → ${status} (${Math.round(duration)}ms)`;

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

if (!useStructuredHttpLog) {
  app.use(requestLogger);
}

// Mount route modules
app.use("/api/monitoring", monitoringRouter);
app.use("/api", documentationRouter);
app.use("/", apiRouter);
app.use("/", healthRouter);
app.use("/", coreTeamRouter);
app.use("/api", formsRouter);
app.use("/api", portfolioRouter);
app.use("/api", notificationsRouter);
app.use("/api/admin", adminRouter);
app.use("/", syncRouter);

const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

const defaultContent = {
  events: [
    {
      id: "kss-153",
      name: "KSS #153 — Knowledge Sharing Session",
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

const fileFilter = (_req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/markdown",
    "application/json",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

getPublicAppUrl();

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
const fileMutex = new Mutex();

export async function runWithFileLock(callback) {
  return await fileMutex.runExclusive(callback);
}

async function readContent() {
  await ensureContentFile();
  const raw = await fsp.readFile(CONTENT_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeContent(content) {
  await ensureContentFile();
  await fsp.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
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

const _rawSupabaseRequest = async function _rawSupabaseRequest(
  pathname,
  { method = "GET", body } = {}
) {
  if (!HAS_SUPABASE) throw new Error("Supabase is not configured");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "GET" ? "count=exact" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

export const supabaseRequest = _rawSupabaseRequest;

export const supabaseBreaker = circuitBreakerRegistry.register(
  "index-supabase",
  new CircuitBreaker(_rawSupabaseRequest, {
    name: "index-supabase",
    failureThreshold: 5,
    successThreshold: 2,
    coolDownPeriod: 10000,
    maxCoolDownPeriod: 60000,
  })
);

// Paginated variant: appends LIMIT/OFFSET to a PostgREST GET request and reads
// the total row count from the Content-Range response header (sent when
// Prefer: count=exact is set). Returns { rows, total } instead of a bare array.
async function supabasePaginatedRequest(pathname, page, limit) {
  if (!HAS_SUPABASE) throw new Error("Supabase is not configured");
  const offset = (page - 1) * limit;
  const separator = pathname.includes("?") ? "&" : "?";
  const url = `${SUPABASE_URL}/rest/v1/${pathname}${separator}limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  const rows = text ? JSON.parse(text) : [];
  // Content-Range format from PostgREST: "0-19/150" or "*/0" when empty
  const contentRange = res.headers.get("content-range") || "";
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : rows.length;
  return { rows, total };
}

// Parses ?page and ?limit from a request query object, clamps to safe bounds,
// and returns normalised integers. Defaults: page=1, limit=20, cap=100.
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
}

function toSafeString(value, max = 4000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function validateWhatsApp(str) {
  const v = String(str || "").trim();
  if (!/^\d{10}$/.test(v))
    throw new Error("WhatsApp must be exactly 10 digits");
  return v;
}

function validateSection(str) {
  const v = String(str || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v))
    throw new Error("Section must be a single letter (A-Z)");
  return v;
}

function sanitizeEvent(input = {}) {
  const status = input.status === "upcoming" ? "upcoming" : "completed";
  const tags = Array.isArray(input.tags)
    ? input.tags
        .map((t) => toSafeString(t, 40))
        .filter(Boolean)
        .slice(0, 12)
    : String(input.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);

  return {
    id:
      toSafeString(input.id || input.shortName || input.name, 80)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `event-${Date.now()}`,
    name: toSafeString(input.name, 120),
    shortName: toSafeString(input.shortName || input.name, 60),
    date: toSafeString(input.date, 80),
    description: toSafeString(input.description, 1200),
    status,
    icon: toSafeString(input.icon || "Pin", 32),
    tags,
  };
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

async function canManageActivityEvent({ name, email, phone, password }) {
  const expectedPassword = process.env.ADMIN_EVENT_PASSWORD;
  // Use constant-time comparison to prevent timing-based password recovery.
  if (!timingSafeStringEqual(String(password ?? ""), expectedPassword)) {
    return false;
  }
  const n = String(name || "")
    .trim()
    .toLowerCase();
  const e = String(email || "")
    .trim()
    .toLowerCase();
  const p = normalizePhone(phone);

  const members = await listCoreTeamStore();
  return members.some(
    (m) =>
      m.name.toLowerCase() === n &&
      m.email.toLowerCase() === e &&
      normalizePhone(m.whatsapp) === p
  );
}

async function listEventsStore({ page = 1, limit = 20 } = {}) {
  if (HAS_SUPABASE) {
    const { rows, total } = await supabasePaginatedRequest(
      "events?select=*&order=created_at.desc",
      page,
      limit
    );
    return {
      events: rows.map((r) =>
        sanitizeEventRecord({
          id: r.id,
          name: r.name,
          shortName: r.short_name || r.shortName || r.name,
          date: r.date_text || r.date,
          description: r.description,
          status: r.status,
          icon: r.icon || "Pin",
          tags: Array.isArray(r.tags) ? r.tags : [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })
      ),
      total,
    };
  }
  const content = await readContent();
  const all = (content.events || []).map((event) => sanitizeEventRecord(event));
  const total = all.length;
  const start = (page - 1) * limit;
  return { events: all.slice(start, start + limit), total };
}

function sanitizeEventRecord(event) {
  return event;
}

async function createEventStore(event) {
  if (HAS_SUPABASE) {
    let payload = {
      id: event.id,
      name: event.name,
      short_name: event.shortName,
      date_text: event.date,
      description: event.description,
      status: event.status,
      icon: event.icon,
      tags: event.tags,
    };

    let row;
    try {
      [row] = await supabaseRequest("events", {
        method: "POST",
        body: [payload],
      });
    } catch (e) {
      // Retry with suffix if id collision occurs.
      payload = { ...payload, id: `${event.id}-${Date.now()}` };
      [row] = await supabaseRequest("events", {
        method: "POST",
        body: [payload],
      });
    }
    return sanitizeEventRecord({
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      date: row.date_text,
      description: row.description,
      status: row.status,
      icon: row.icon || "Pin",
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  // Safe atomic fallback operation preventing data loss using async-mutex
  return withContentLock(async () => {
    const content = await readContent();
    content.events.unshift({
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await writeContent(content);
    return sanitizeEventRecord(content.events[0]);
  });
}
async function updateEventStore(id, patch) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest(
      `events?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: {
          name: patch.name,
          short_name: patch.shortName,
          date_text: patch.date,
          description: patch.description,
          status: patch.status,
          icon: patch.icon,
          tags: patch.tags,
          updated_at: new Date().toISOString(),
        },
      }
    );
    if (!row) return null;
    return sanitizeEventRecord({
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      date: row.date_text,
      description: row.description,
      status: row.status,
      icon: row.icon || "Pin",
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  return withContentLock(async () => {
    const content = await readContent();
    const idx = content.events.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    content.events[idx] = {
      ...content.events[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await writeContent(content);
    return sanitizeEventRecord(content.events[idx]);
  });
}

async function deleteEventStore(id) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      `events?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  return withContentLock(async () => {
    const content = await readContent();
    const before = content.events.length;
    content.events = content.events.filter((e) => e.id !== id);
    if (content.events.length === before) return false;
    await writeContent(content);
    return true;
  });
}

async function listActivityEventsStore(
  activityKey,
  { page = 1, limit = 20 } = {}
) {
  if (HAS_SUPABASE) {
    const { rows, total } = await supabasePaginatedRequest(
      `activity_events?activity_key=eq.${encodeURIComponent(activityKey)}&select=*&order=created_at.desc`,
      page,
      limit
    );
    return {
      events: rows.map((r) =>
        sanitizeActivityEventRecord({
          id: r.id,
          name: r.name,
          date: r.date_text || r.date,
          tagline: r.tagline,
          description: r.description,
          status: r.status || "completed",
          createdAt: r.created_at,
        })
      ),
      total,
    };
  }
  const content = await readContent();
  const all = (content.activityEvents?.[activityKey] || []).map((event) =>
    sanitizeActivityEventRecord(event)
  );
  const total = all.length;
  const start = (page - 1) * limit;
  return { events: all.slice(start, start + limit), total };
}

function sanitizeActivityEventRecord(event) {
  if (!event || typeof event !== "object") return event;
  const { createdBy, ...safe } = event;
  return safe;
}

async function createActivityEventStore(activityKey, event) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest("activity_events", {
      method: "POST",
      body: [
        {
          id: event.id,
          activity_key: activityKey,
          name: event.name,
          date_text: event.date,
          tagline: event.tagline,
          description: event.description,
          status: event.status,
          created_by_name: event.createdBy?.name || "",
          created_by_email: event.createdBy?.email || "",
          created_by_phone: event.createdBy?.phone || "",
        },
      ],
    });
    return sanitizeActivityEventRecord({
      id: row.id,
      name: row.name,
      date: row.date_text,
      tagline: row.tagline,
      description: row.description,
      status: row.status || "completed",
      createdAt: row.created_at,
    });
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.activityEvents = content.activityEvents || {};
    content.activityEvents[activityKey] =
      content.activityEvents[activityKey] || [];
    content.activityEvents[activityKey].unshift(event);
    await writeContent(content);
    return sanitizeActivityEventRecord(event);
  });
}

async function deleteActivityEventStore(activityKey, eventId) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      `activity_events?activity_key=eq.${encodeURIComponent(activityKey)}&id=eq.${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.activityEvents = content.activityEvents || {};
    const list = content.activityEvents[activityKey] || [];
    const next = list.filter((e) => e.id !== eventId);
    if (next.length === list.length) return false;
    content.activityEvents[activityKey] = next;
    await writeContent(content);
    return true;
  });
}

async function listCoreTeamStore() {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      "core_team_members?select=*&order=created_at.asc"
    );
    return rows.map((r) =>
      sanitizeCoreTeamMemberRecord({
        id: r.id,
        name: r.name,
        role: r.role,
        year: r.year,
        branch: r.branch,
        section: r.section,
        email: r.email,
        whatsapp: r.whatsapp,
        linkedin: r.linkedin,
        instagram: r.instagram,
        photoUrl: r.photo_url,
        createdAt: r.created_at,
      })
    );
  }
  const content = await readContent();
  return (content.coreTeam || []).map((member) =>
    sanitizeCoreTeamMemberRecord(member)
  );
}

function sanitizeCoreTeamMemberRecord(member) {
  return member;
}

async function createCoreTeamStore(member) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest("core_team_members", {
      method: "POST",
      body: [
        {
          name: member.name,
          role: member.role,
          year: member.year,
          branch: member.branch,
          section: member.section,
          email: member.email,
          whatsapp: member.whatsapp,
          linkedin: member.linkedin,
          instagram: member.instagram,
          photo_url: member.photoUrl,
        },
      ],
    });
    return sanitizeCoreTeamMemberRecord({
      id: row.id,
      name: row.name,
      role: row.role,
      year: row.year,
      branch: row.branch,
      section: row.section,
      email: row.email,
      whatsapp: row.whatsapp,
      linkedin: row.linkedin,
      instagram: row.instagram,
      photoUrl: row.photo_url,
      createdAt: row.created_at,
    });
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.coreTeam = content.coreTeam || [];
    const newMember = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    content.coreTeam.push(newMember);
    await writeContent(content);
    return sanitizeCoreTeamMemberRecord(newMember);
  });
}

async function deleteCoreTeamStore(id) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      `core_team_members?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.coreTeam = content.coreTeam || [];
    const before = content.coreTeam.length;
    content.coreTeam = content.coreTeam.filter(
      (m) => String(m.id) !== String(id)
    );
    if (content.coreTeam.length === before) return false;
    await writeContent(content);
    return true;
  });
}

async function appendToSupabaseForms(formType, payload) {
  if (!HAS_SUPABASE) return false;
  try {
    await supabaseRequest("form_submissions", {
      method: "POST",
      body: [
        {
          form_type: formType,
          full_name: toSafeString(payload.fullName, 140),
          college_email: toSafeString(payload.collegeEmail, 140),
          whatsapp: toSafeString(payload.whatsapp, 40),
          payload,
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

// Constant-time string comparison that does not short-circuit on the first
// mismatched character. Both operands are encoded to UTF-8 Buffers of equal
// length before the comparison so response time is independent of how many
// leading characters match. Returns false immediately if either value is empty,
// so callers cannot exploit a zero-length buffer edge case.
function timingSafeStringEqual(a, b) {
  const sa = String(a ?? "");
  const sb = String(b ?? "");
  if (!sa.length || !sb.length) return sa === sb;
  const ba = Buffer.from(sa, "utf8");
  const bb = Buffer.from(sb, "utf8");
  // Buffers must be the same byte length for timingSafeEqual. Pad the shorter
  // one so the comparison always runs the full loop.
  if (ba.length !== bb.length) {
    const maxLen = Math.max(ba.length, bb.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    ba.copy(paddedA);
    bb.copy(paddedB);
    // The length mismatch already means they cannot be equal, but we still run
    // the full comparison so the execution time is data-independent.
    crypto.timingSafeEqual(paddedA, paddedB);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

// Per-IP failed-attempt tracking for the activity-event auth endpoints.
// Mirrors the passkey lockout pattern used for portfolio mutations below.
const failedActivityAuthAttempts = new Map();
const ACTIVITY_AUTH_MAX_ATTEMPTS = 5;
const ACTIVITY_AUTH_LOCKOUT_MS = 15 * 60 * 1000;

function checkActivityAuthLockout(ip) {
  const entry = failedActivityAuthAttempts.get(ip);
  if (!entry) return null;
  if (Date.now() > entry.lockoutUntil) {
    failedActivityAuthAttempts.delete(ip);
    return null;
  }
  return entry;
}

function recordFailedActivityAuth(ip) {
  const entry = failedActivityAuthAttempts.get(ip) || {
    count: 0,
    lockoutUntil: 0,
  };
  entry.count += 1;
  if (entry.count >= ACTIVITY_AUTH_MAX_ATTEMPTS) {
    entry.lockoutUntil = Date.now() + ACTIVITY_AUTH_LOCKOUT_MS;
    entry.count = 0;
  }
  failedActivityAuthAttempts.set(ip, entry);
  return entry;
}

function clearActivityAuthAttempts(ip) {
  failedActivityAuthAttempts.delete(ip);
}

// Admin Analytics & Metrics (mounted with admin auth)
app.use("/api/admin/analytics", adminAuth, analyticsRouter);
app.use("/api/admin/metrics", adminAuth, adminStreamRouter);

// OAuth / SSO Student Auth Endpoints
app.get("/api/auth/google", studentAuthController.googleAuth);
app.get("/api/auth/google/callback", studentAuthController.googleCallback);
app.get("/api/auth/github", studentAuthController.githubAuth);
app.get("/api/auth/github/callback", studentAuthController.githubCallback);
app.get("/api/auth/me", requireStudentAuth, studentAuthController.getMe);
app.post("/api/auth/logout", studentAuthController.logout);

// ── Event Admin Management ──
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
app.post("/api/streams", streamController.createStream);
app.put("/api/streams/:id", streamController.updateStream);
app.patch("/api/streams/:id/status", streamController.setStreamStatus);
app.delete("/api/streams/:id", streamController.deleteStream);
app.post("/api/streams/:id/chat", streamController.addChatMessage);
app.get("/api/streams/:id/chat", streamController.listChatMessages);
app.post("/api/streams/:id/polls", streamController.createPoll);
app.get("/api/streams/:id/polls", streamController.listPolls);
app.post("/api/streams/polls/:pollId/vote", streamController.votePoll);
app.patch("/api/streams/polls/:pollId/close", streamController.closePoll);
app.patch(
  "/api/streams/chat/:messageId/moderate",
  streamController.moderateChatMessage
);
app.get("/api/admin/streams", adminAuth, streamController.adminListAll);

// Public listings
app.get("/api/content/team", async (req, res) => {
  try {
    const rawMembers = await coreTeamService.listMembers();
    const members = (rawMembers || []).map((m) => {
      let email = m.email || null;
      if (email && !email.toLowerCase().endsWith("@glbajajgroup.org")) {
        email = null;
      }
      return {
        ...m,
        email,
        whatsapp: "https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ",
      };
    });
    return res.json({ members });
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

// Dynamic forms
app.post(
  "/api/forms/membership",
  formRateLimiter,
  formsController.makeHandleForm("membership")
);
app.post(
  "/api/forms/recruitment",
  formRateLimiter,
  formsController.makeHandleForm("recruitment")
);
app.post(
  "/api/core-team/apply",
  formRateLimiter,
  formsController.makeHandleForm("core_team")
);

app.post(
  "/api/submissions/membership",
  formRateLimiter,
  formsController.makeHandleForm("membership")
);
app.post(
  "/api/submissions/recruitment",
  formRateLimiter,
  formsController.makeHandleForm("recruitment")
);

// Admin membership responses
async function _rawMembershipFetch(scriptUrl, secret) {
  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getResponses", token: secret }),
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

app.get("/api/admin/membership", adminAuth, async (req, res) => {
  try {
    const scriptUrl = process.env.MEMBERSHIP_SCRIPT_URL;
    const secret = process.env.MEMBERSHIP_SECRET;

    if (!scriptUrl || !secret) {
      return res.json({ responses: [] });
    }

    const data = await membershipBreaker.execute(scriptUrl, secret);
    return res.json({ responses: data.responses || [] });
  } catch (err) {
    if (err.code === "CIRCUIT_OPEN") {
      console.warn(
        "[Membership] Circuit breaker is OPEN, returning empty responses"
      );
      return res.json({ responses: [] });
    }
    console.error("[Membership] Failed to fetch responses:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to fetch membership responses" });
  }
});

// Circuit Breaker Admin API
app.get("/api/admin/circuit-breaker/metrics", adminAuth, async (req, res) => {
  const metrics = circuitBreakerRegistry.getAllMetrics();
  return res.json({ circuitBreakers: metrics });
});

app.post(
  "/api/admin/circuit-breaker/reset/:name",
  adminAuth,
  async (req, res) => {
    const { name } = req.params;
    const ok = circuitBreakerRegistry.reset(name);
    if (!ok) {
      return res
        .status(404)
        .json({ error: `No circuit breaker found: "${name}"` });
    }
    return res.json({
      ok: true,
      message: `Circuit breaker "${name}" reset to CLOSED`,
    });
  }
);

app.post(
  "/api/admin/circuit-breaker/retry/:name",
  adminAuth,
  async (req, res) => {
    const { name } = req.params;
    try {
      const breaker = circuitBreakerRegistry.get(name);
      if (!breaker) {
        return res
          .status(404)
          .json({ error: `No circuit breaker found: "${name}"` });
      }
      const result = await breaker.manualRetry();
      return res.json({ ok: true, state: breaker.state, result });
    } catch (err) {
      return res.json({ ok: false, error: err.message });
    }
  }
);

app.get("/api/admin/me", adminAuth, (req, res) => {
  return res.json({ username: req.adminSession.username });
});

// Real-time Push Subscriber channels.
// The in-memory Set is a fast local mirror. When a PostgreSQL database is
// configured (DATABASE_URL present), subscriptions are also persisted to the
// push_subscriptions table so they survive server restarts, deploys, and
// crashes. When no database is configured the store degrades to memory-only,
// preserving the previous behavior for local development.
const pushSubscriptions = new Set();

const PUSH_PERSISTENCE_ENABLED = Boolean(process.env.DATABASE_URL);

// Load any previously persisted subscriptions into the in-memory mirror at
// startup so a restart does not silently drop registered subscribers.
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

    // Strict sanitization: reconstruct object to drop malicious properties and limit memory size
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

function requireNotificationAuth(req, res, next) {
  adminAuthMiddleware.requireAdmin(req, res, (err) => {
    if (!err && req.adminSession) {
      return next();
    }
    requireStudentAuth(req, res, (err2) => {
      if (!err2 && req.studentUser) {
        return next();
      }
      return res
        .status(401)
        .json({ error: "Unauthorized: Authentication required" });
    });
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

app.post(
  "/api/notifications",
  adminAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId, title, message, type, link } = req.body || {};
      if (!title || !message) {
        return res
          .status(400)
          .json({ error: "title and message are required" });
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
      return res.json({ success: true, notification: note });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Portfolio routing support
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
    console.error("Error fetching portfolio:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
});

// Hard cap on tracked entries. When the limit is reached, the
// oldest inserted entry is evicted before adding a new one, preventing the
// Map from growing without bound when an attacker rotates through many
// distinct usernames from the same or different IP addresses.
const MAX_PASSKEY_TRACKED_KEYS = 10_000;
const failedPasskeyAttemptsByIp = new Map();
const failedPasskeyAttemptsByUsername = new Map();

// Periodic sweep every 30 minutes: remove entries whose lockout period has
// expired and whose attempt count has already been reset to 0, so they do
// not accumulate for keys that are never visited again.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of failedPasskeyAttemptsByIp) {
      if (entry.count === 0 && now > entry.lockoutUntil) {
        failedPasskeyAttemptsByIp.delete(key);
      }
    }
    for (const [key, entry] of failedPasskeyAttemptsByUsername) {
      if (now > entry.lockoutUntil) {
        failedPasskeyAttemptsByUsername.delete(key);
      }
    }
  },
  30 * 60 * 1000
).unref();

function checkPasskeyLockout(username, ip) {
  const ipKey = String(ip || "unknown");
  const userKey = String(username || "").toLowerCase();

  const ipEntry = failedPasskeyAttemptsByIp.get(ipKey);
  const userEntry = failedPasskeyAttemptsByUsername.get(userKey);

  const now = Date.now();

  if (ipEntry && ipEntry.lockoutUntil !== 0 && now <= ipEntry.lockoutUntil) {
    return true;
  }

  if (
    userEntry &&
    userEntry.lockoutUntil !== 0 &&
    now <= userEntry.lockoutUntil
  ) {
    return true;
  }

  // Cleanup expired entries proactively
  if (ipEntry && ipEntry.lockoutUntil !== 0 && now > ipEntry.lockoutUntil) {
    failedPasskeyAttemptsByIp.delete(ipKey);
  }
  if (
    userEntry &&
    userEntry.lockoutUntil !== 0 &&
    now > userEntry.lockoutUntil
  ) {
    failedPasskeyAttemptsByUsername.delete(userKey);
  }

  return false;
}

function recordFailedPasskeyAttempt(username, ip) {
  const ipKey = String(ip || "unknown");
  const userKey = String(username || "").toLowerCase();

  // IP tracking
  if (
    !failedPasskeyAttemptsByIp.has(ipKey) &&
    failedPasskeyAttemptsByIp.size >= MAX_PASSKEY_TRACKED_KEYS
  ) {
    failedPasskeyAttemptsByIp.delete(
      failedPasskeyAttemptsByIp.keys().next().value
    );
  }
  const ipEntry = failedPasskeyAttemptsByIp.get(ipKey) || {
    count: 0,
    lockoutUntil: 0,
  };
  ipEntry.count += 1;
  if (ipEntry.count >= 5) {
    ipEntry.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    ipEntry.count = 0; // Reset count so they need 5 more AFTER lockout to be locked again
  }
  failedPasskeyAttemptsByIp.set(ipKey, ipEntry);

  // Username tracking (Exponential backoff)
  if (
    !failedPasskeyAttemptsByUsername.has(userKey) &&
    failedPasskeyAttemptsByUsername.size >= MAX_PASSKEY_TRACKED_KEYS
  ) {
    failedPasskeyAttemptsByUsername.delete(
      failedPasskeyAttemptsByUsername.keys().next().value
    );
  }
  const userEntry = failedPasskeyAttemptsByUsername.get(userKey) || {
    count: 0,
    lockoutUntil: 0,
  };
  userEntry.count += 1;
  if (userEntry.count >= 5) {
    // 5 attempts = 1 min, 6 = 2 mins, 7 = 4 mins, 8 = 8 mins, 9+ = 15 mins
    const factor = Math.pow(2, Math.max(0, userEntry.count - 5));
    const delayMinutes = Math.min(15, factor);
    userEntry.lockoutUntil = Date.now() + delayMinutes * 60 * 1000;
  }
  failedPasskeyAttemptsByUsername.set(userKey, userEntry);

  return { ipEntry, userEntry };
}

function clearPasskeyAttempts(username, ip) {
  const ipKey = String(ip || "unknown");
  const userKey = String(username || "").toLowerCase();

  failedPasskeyAttemptsByIp.delete(ipKey);
  failedPasskeyAttemptsByUsername.delete(userKey);
}

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = req.query.userId || "global";

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
        return res
          .status(401)
          .json({ error: "Unauthorized to view these notifications" });
      }
    }

    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const list = await notificationsService.getNotifications(
      userId,
      offset,
      limit
    );
    return res.json({ notifications: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Notification Preferences
app.get("/api/notifications/preferences", async (req, res) => {
  try {
    const userId = req.query.userId || "global";
    const prefs = await notificationPreferencesRepository.list(userId);
    return res.json({ preferences: prefs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/preferences", async (req, res) => {
  try {
    const userId = req.body.userId || "global";
    const { category, email, push, in_app } = req.body;
    if (!category)
      return res.status(400).json({ error: "category is required" });
    const pref = await notificationPreferencesRepository.set(userId, category, {
      email,
      push,
      in_app,
    });
    return res.json({ preference: pref });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/preferences/bulk", async (req, res) => {
  try {
    const userId = req.body.userId || "global";
    const { preferences } = req.body;
    if (!Array.isArray(preferences) || !preferences.length) {
      return res.status(400).json({ error: "preferences array is required" });
    }
    const results = await notificationPreferencesRepository.setBulk(
      userId,
      preferences
    );
    return res.json({ preferences: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Forum / Q&A ──
app.get("/api/forum/categories", forumController.listCategories);
app.get("/api/forum/threads", forumController.listThreads);
app.get("/api/forum/threads/:id", forumController.getThread);
app.post("/api/forum/threads", forumController.createThread);
app.put("/api/forum/threads/:id", forumController.updateThread);
app.delete("/api/forum/threads/:id", forumController.deleteThread);
app.get("/api/forum/threads/:id/replies", forumController.listReplies);
app.post("/api/forum/threads/:id/replies", forumController.createReply);
app.put("/api/forum/replies/:replyId", forumController.updateReply);
app.delete("/api/forum/replies/:replyId", forumController.deleteReply);
app.post("/api/forum/threads/:id/vote", forumController.voteThread);
app.post("/api/forum/replies/:replyId/vote", forumController.voteReply);
app.post("/api/forum/threads/:id/accept/:replyId", forumController.acceptReply);
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

// ── Mentorship & Buddy System ──
app.get("/api/mentorship/mentors", mentorshipController.listMentors);
app.get("/api/mentorship/mentors/:id", mentorshipController.getMentor);
app.post("/api/mentorship/mentors", mentorshipController.registerMentor);
app.put("/api/mentorship/mentors/:id", mentorshipController.updateMentor);
app.post("/api/mentorship/requests", mentorshipController.requestMentorship);
app.get("/api/mentorship/requests", mentorshipController.listMentorships);
app.get("/api/mentorship/requests/:id", mentorshipController.getMentorship);
app.put(
  "/api/mentorship/requests/:id/status",
  mentorshipController.updateMentorshipStatus
);
app.post(
  "/api/mentorship/requests/:id/sessions",
  mentorshipController.logSession
);
app.get(
  "/api/mentorship/requests/:id/sessions",
  mentorshipController.listSessions
);
app.post("/api/mentorship/buddy-pairs", mentorshipController.createBuddyPair);
app.get("/api/mentorship/buddy-pairs", mentorshipController.listBuddyPairs);
app.get("/api/admin/mentorships", adminAuth, mentorshipController.adminListAll);
app.get("/api/admin/mentors", adminAuth, mentorshipController.adminListMentors);

// ── Search, Discovery & Recommendation Engine ──
app.get("/api/search", searchController.search);
app.get("/api/search/trending", searchController.trending);
app.get("/api/recommendations", searchController.recommendations);
// ── Resource Library Routes ──
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
  upload.single("file"),
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
  console.error(
    "[Process] Unhandled rejection:",
    reason instanceof Error ? reason.message : reason
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
