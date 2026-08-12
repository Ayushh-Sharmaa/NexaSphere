import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseRequest, HAS_SUPABASE } from '../storage/supabaseClient.js';
import { validate } from '../middleware/validate.js';
import {
  customFunnelSchema,
  saveReportSchema,
  executeReportSchema,
} from '../validators/routes/analyticsRouteSchemas.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import {
  getDashboardSummary,
  getUserAnalytics,
  getEngagementFunnel,
  getCustomFunnel,
  getFunnelStepTypes,
  executeCustomReport,
  saveCustomReport,
  getCustomReports,
} from '../controllers/analyticsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

// Default TTL for the in-process analytics cache (15 seconds). Overridable via
// ANALYTICS_CACHE_TTL_MS so operators can tune it without a code change.
const DEFAULT_TTL_MS = 15_000;

function getCacheTtlMs() {
  const v = Number(process.env.ANALYTICS_CACHE_TTL_MS);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_TTL_MS;
}

// Module-level cache shared across all requests. A single object is cheaper
// than a Map because analytics only has one logical dataset.
const cache = {
  data: null,
  cachedAt: 0,
};

/**
 * Reads `content.json` from disk and returns its parsed value.
 * Returns a safe empty structure when the file is absent or unreadable so
 * analytics routes never 500 on a cold start.
 */
async function readContentSafe() {
  try {
    const raw = await fs.readFile(CONTENT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { events: [], activityEvents: {}, coreTeam: [] };
  }
}

/**
 * Returns content from the in-process cache when the entry is fresh, otherwise
 * reads from disk, stores the result, and resets the timestamp.
 * Concurrent callers that arrive while a read is in flight all await the same
 * promise so the file is read at most once per TTL window.
 */
let inflightRead = null;

async function getCachedContent() {
  const ttlMs = getCacheTtlMs();
  if (cache.data !== null && Date.now() - cache.cachedAt < ttlMs) {
    return cache.data;
  }
  // Deduplicate concurrent cache misses: if a read is already in flight, wait
  // for it rather than issuing a second fs.readFile.
  if (!inflightRead) {
    inflightRead = readContentSafe().then((data) => {
      cache.data = data;
      cache.cachedAt = Date.now();
      inflightRead = null;
      return data;
    });
  }
  return inflightRead;
}

/**
 * Invalidates the analytics cache immediately so the next request re-reads
 * from the source of truth. Call this after any write operation (event create,
 * update, delete; activity-event create/delete; core-team create/delete).
 */
export function invalidateAnalyticsCache() {
  cache.data = null;
  cache.cachedAt = 0;
}

const router = Router();

/**
 * GET /
 * Returns a high-level summary of events, activity events, and core team members.
 */
router.get('/', (req, res) => {
  sendSuccess(res, { ok: true, message: 'Analytics endpoint is available.' });
});

router.get('/stats', async (req, res) => {
  try {
    let totalUsers = null;
    let activeRegistrations = null;
    let upcomingEvents = null;
    const conversionRate = null;

    if (HAS_SUPABASE) {
      const [events, submissions] = await Promise.all([
        supabaseRequest('events?select=status'),
        supabaseRequest('form_submissions?select=id,college_email'),
      ]);

      upcomingEvents = events.filter(e => e.status === 'upcoming').length;
      activeRegistrations = submissions.length;

      const uniqueEmails = new Set(submissions.map((s) => s.college_email).filter(Boolean));
      totalUsers = uniqueEmails.size > 0 ? uniqueEmails.size : submissions.length;
    } else {
      const content = await getCachedContent();
      upcomingEvents = (content.events || []).filter((e) => e.status === 'upcoming').length;
    }

    sendSuccess(res, { totalUsers, activeRegistrations, upcomingEvents, conversionRate });
  } catch (error) {
    sendError(req, res, error.message || 'Failed to generate stats', 500, 'INTERNAL_ERROR');
  }
});

router.get('/growth', async (_req, res) => {
  try {
    let growth = [];

    if (HAS_SUPABASE) {
      const submissions = await supabaseRequest(
        'form_submissions?select=created_at&order=created_at.asc'
      );
      const dailyCounts = {};

      for (const sub of submissions) {
        if (!sub.created_at) continue;
        const date = sub.created_at.split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }

      growth = Object.keys(dailyCounts)
        .sort((a, b) => a - b)
        .map((date) => ({
          date,
          registrations: dailyCounts[date],
        }));
    }

    sendSuccess(res, growth);
  } catch (error) {
    sendError(req, res, error.message || 'Failed to generate growth data', 500, 'INTERNAL_ERROR');
  }
});

router.get('/events', async (_req, res) => {
  try {
    let eventStats = [];

    if (HAS_SUPABASE) {
      const [events, submissions] = await Promise.all([
        supabaseRequest('events?select=id,name'),
        supabaseRequest('form_submissions?select=form_type'),
      ]);

      const countsByFormType = {};
      for (const sub of submissions) {
        if (!sub.form_type) continue;
        countsByFormType[sub.form_type] = (countsByFormType[sub.form_type] || 0) + 1;
      }

      eventStats = events.map((e) => ({
        name: e.name,
        capacity: null,
        attendance: countsByFormType[e.id] || 0,
        waitlist: null,
      }));
    }

    sendSuccess(res, eventStats);
  } catch (error) {
    sendError(req, res, error.message || 'Failed to generate events data', 500, 'INTERNAL_ERROR');
  }
});

// Comprehensive Analytics endpoints
router.get('/summary', getDashboardSummary);
router.get('/users', getUserAnalytics);
router.get('/funnel', getEngagementFunnel);

// Custom Funnel Analysis
router.get('/funnel/steps', getFunnelStepTypes);
router.post('/funnel/custom', validate(customFunnelSchema), getCustomFunnel);

// Custom Reports
router.get('/reports', getCustomReports);
router.post('/reports', validate(saveReportSchema), saveCustomReport);
router.post('/reports/execute', validate(executeReportSchema), executeCustomReport);

export default router;
