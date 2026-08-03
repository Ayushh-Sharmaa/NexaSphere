import {
  supabaseRequest,
  supabaseBreaker,
  HAS_SUPABASE,
  requiredEnv,
  normalizePrivateKey,
} from '../storage/supabaseClient.js';
import { google } from 'googleapis';
import { ZodError } from 'zod/v3';
import { normalizeFormSubmission } from '../validators/formSchemas.js';
import { getPublicAppUrl } from '../utils/publicAppUrl.js';
import { sendWelcomeVerificationEmail } from './emailService.js';
import { broadcastSSEEvent } from './sseService.js';
import { emitToRole } from '../config/socket.js';
import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let _sheetsClient = null;

function getSheetsClient() {
  if (_sheetsClient) return _sheetsClient;
  const auth = new google.auth.JWT({
    email: requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    key: normalizePrivateKey(requiredEnv('GOOGLE_PRIVATE_KEY')),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _sheetsClient = google.sheets({ version: 'v4', auth });
  return _sheetsClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_DIR = path.join(__dirname, '..', 'data', 'fallback-submissions');

function ensureFallbackDir() {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
}

function writeFallbackSubmission(formType, payload, error) {
  try {
    ensureFallbackDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${formType}-${timestamp}-${Date.now()}.json`;
    const filePath = path.join(FALLBACK_DIR, filename);
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          formType,
          payload,
          submittedAt: new Date().toISOString(),
          error: error?.message || 'Supabase unreachable',
        },
        null,
        2
      ),
      'utf8'
    );
    logger.error(`[Forms Service] Supabase insertion failed - saved fallback to ${filePath}`);
  } catch (writeErr) {
    logger.error('[Forms Service] Failed to write fallback submission file:', { error: writeErr?.message });
  }
}

function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

async function _sheetAppend(spreadsheetId, sheetName, row, sheets) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

const _sheetBreaker = circuitBreakerRegistry.register(
  'google-sheets',
  new CircuitBreaker(_sheetAppend, {
    name: 'google-sheets',
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 10000,
    maxCoolDownPeriod: 60000,
  })
);
// ── Offline retry queue ────────────────────────────────────────────────
const QUEUE_FILE = path.join(__dirname, '..', 'data', 'pending-forms.json');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 5000; // 5 seconds, doubled each retry

let pendingQueue = [];
let processing = false;

function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      pendingQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch {
    pendingQueue = [];
  }
}

function saveQueue() {
  try {
    const dir = path.dirname(QUEUE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(pendingQueue, null, 2), 'utf8');
  } catch (err) {
    logger.error('[Forms Queue] Failed to persist queue:', { error: err?.message });
  }
}

function enqueue(formType, payload) {
  pendingQueue.push({
    formType,
    payload,
    retries: 0,
    timestamp: Date.now(),
  });
  saveQueue();
  if (!processing) processQueue();
}

function dequeue(index) {
  pendingQueue.splice(index, 1);
  saveQueue();
}

async function processQueue() {
  if (processing || pendingQueue.length === 0) return;
  processing = true;

  const batch = [...pendingQueue];
  pendingQueue = [];

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    try {
      await formsService.appendToSupabaseForms(item.formType, item.payload);
      // success — drop from queue (do NOT re-add)
    } catch {
      item.retries++;
      if (item.retries < MAX_RETRIES) {
        batch.push(item);
      } else {
        logger.error(`[Forms Queue] Max retries exceeded for ${item.formType}:`, { payload: item.payload });
      }
    }
  }

  pendingQueue = batch;
  saveQueue();
  processing = false;

  if (pendingQueue.length > 0) {
    const delay = BASE_DELAY_MS * Math.pow(2, pendingQueue[0].retries);
    setTimeout(processQueue, Math.min(delay, 120000));
  }
}

// Load persisted queue on startup
loadQueue();
if (pendingQueue.length > 0) {
  setTimeout(processQueue, 3000);
}

export const formsService = {
  async appendToSupabaseForms(formType, payload) {
    if (!HAS_SUPABASE) return false;
    try {
      await supabaseBreaker.execute('form_submissions', {
        method: 'POST',
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
    } catch (err) {
      if (err.code === 'CIRCUIT_OPEN') {
        logger.warn('[Forms Service] Supabase circuit breaker is OPEN, using fallback');
      } else {
        logger.error('[Forms Service] Supabase insertion failed:', { error: err?.message || err });
      }
      writeFallbackSubmission(formType, payload, err);
      return false;
    }
  },

  async appendFormToSheet(formType, payload) {
    const spreadsheetId = requiredEnv('GOOGLE_SHEET_ID');
    const sheets = getSheetsClient();

    const defaultTab = process.env.GOOGLE_SHEET_TAB_NAME || 'Responses';
    const tabMap = {
      membership: process.env.GOOGLE_MEMBERSHIP_TAB_NAME || 'MembershipResponses',
      recruitment: process.env.GOOGLE_RECRUITMENT_TAB_NAME || 'RecruitmentResponses',
      core_team: process.env.GOOGLE_CORE_TEAM_TAB_NAME || 'CoreTeamResponses',
    };
    const sheetName = tabMap[formType] || defaultTab;

    const now = new Date().toISOString();
    const row = [
      now,
      formType,
      toSafeString(payload.fullName, 140),
      toSafeString(payload.collegeEmail, 140),
      toSafeString(payload.whatsapp, 40),
      JSON.stringify(payload),
    ];

    await _sheetBreaker.execute(spreadsheetId, sheetName, row, sheets);
  },

  async handleForm(formType, body) {
    try {
      const payload = normalizeFormSubmission(formType, body || {});
      const savedToSupabase = await this.appendToSupabaseForms(formType, payload);
      let sheetsWriteFailed = false;
      let savedToSheet = false;
      try {
        await this.appendFormToSheet(formType, payload);
        savedToSheet = true;
      } catch (sheetErr) {
        logger.error('[Forms Service] Failed to append to Google Sheet:', { error: sheetErr?.message });
        sheetsWriteFailed = true;
        if (!savedToSupabase) throw sheetErr;
        logger.error('[Forms Service] Google Sheets append failed:', { error: sheetErr?.message });
      }

      // If both storage backends failed, queue for retry instead of losing data
      if (!savedToSupabase && !savedToSheet) {
        enqueue(formType, payload);
        logger.warn(`[Forms Service] Queued ${formType} submission for retry (both storage backends failed)`);
      }

      try {
        const verifyUrl = `${getPublicAppUrl()}/verify?email=${encodeURIComponent(payload.collegeEmail)}`;
        await sendWelcomeVerificationEmail(payload.collegeEmail, payload.fullName, verifyUrl);
      } catch (emailErr) {
        logger.error('[Forms Service] Failed to send welcome verification email:', { error: emailErr?.message });
      }

      try {
        broadcastSSEEvent('registration', {
          formType,
          fullName: payload.fullName,
          timestamp: new Date().toISOString(),
        });
        emitToRole('membership_admin', 'admin:new-registration', {
          formType,
          userName: payload.fullName,
          timestamp: new Date(),
        });
      } catch (realtimeErr) {
        logger.error('[Forms Service] Failed to broadcast real-time updates:', { error: realtimeErr?.message });
      }

      // Return success with optional warning if Sheets write failed
      const result = { ok: true };
      if (sheetsWriteFailed && savedToSupabase) {
        result.warning = 'Submission saved but secondary sync failed. Data is safe.';
      }
      return result;
    } catch (e) {
      if (e instanceof ZodError) {
        const issues = e.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        const err = new Error('Invalid form submission');
        err.details = issues;
        throw err;
      }
      throw e;
    }
  },
};
