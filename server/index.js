import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) : true,
  credentials: false,
}));
app.use(express.json({ limit: '256kb' }));

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function normalizePrivateKey(k) {
  // GitHub/Windows env vars often escape newlines.
  return k.includes('\\n') ? k.replace(/\\n/g, '\n') : k;
}

async function appendToSheet(payload) {
  const clientEmail = requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(requiredEnv('GOOGLE_PRIVATE_KEY'));
  const spreadsheetId = requiredEnv('GOOGLE_SHEET_ID');
  const sheetName = process.env.GOOGLE_SHEET_TAB_NAME || 'Responses';

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const now = new Date().toISOString();
  const interests = Array.isArray(payload.interests) ? payload.interests.join(', ') : '';

  const row = [
    now,
    payload.fullName || '',
    payload.collegeEmail || '',
    payload.whatsapp || '',
    payload.year || '',
    payload.branch || '',
    payload.section || '',
    payload.role || '',
    interests,
    payload.skills || '',
    payload.comms || '',
    payload.campusExp || '',
    payload.campusExpDetails || '',
    payload.links || '',
    payload.commitHours || '',
    payload.attendCampus || '',
    payload.assessmentOk || '',
    payload.whyJoin || '',
    payload.anythingElse || '',
    payload.declaration || '',
    payload.submittedAt || '',
    payload.userAgent || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

function isPhoneish(s) {
  const v = String(s || '').trim();
  if (!v) return false;
  return /^[+()\-\s0-9]{8,20}$/.test(v);
}

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.post('/api/core-team/apply', async (req, res) => {
  try {
    const body = req.body || {};

    const required = [
      'fullName',
      'collegeEmail',
      'whatsapp',
      'year',
      'branch',
      'section',
      'role',
      'skills',
      'comms',
      'campusExp',
      'commitHours',
      'attendCampus',
      'assessmentOk',
      'whyJoin',
      'declaration',
    ];

    const missing = required.filter(k => !String(body[k] || '').trim());
    if (missing.length) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    }

    if (!isEmail(body.collegeEmail)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (!isPhoneish(body.whatsapp)) {
      return res.status(400).json({ error: 'Invalid contact number.' });
    }

    if (body.declaration === 'I do not agree to the above declaration.') {
      return res.status(400).json({ error: 'Declaration not accepted.' });
    }

    await appendToSheet(body);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`NexaSphere server listening on http://localhost:${port}`);
});

