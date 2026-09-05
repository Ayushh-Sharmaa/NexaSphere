import 'dotenv/config';
import express from 'express';
import { EventEmitter } from 'events';
import cors from 'cors';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRouter from './routes/api.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) : true,
  credentials: false,
}));
app.use(express.json({ limit: '512kb' }));

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, path } = req;

  res.on('finish', () => {
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

app.use(requestLogger);

const sessions = new Map();
const adminEvents = new EventEmitter();
adminEvents.on('CORE_TEAM_MEMBER_ADDED', (event) => console.log(`[EVENT] CORE_TEAM_MEMBER_ADDED:`, event));
adminEvents.on('CORE_TEAM_MEMBER_REMOVED', (event) => console.log(`[EVENT] CORE_TEAM_MEMBER_REMOVED:`, event));

const defaultContent = {
  events: [
    {
      id: 'kss-153',
      name: 'KSS #153 — Knowledge Sharing Session',
      shortName: 'KSS #153',
      date: 'March 14, 2025',
      description: 'NexaSphere\'s inaugural Knowledge Sharing Session focused on the impact of AI.',
      status: 'completed',
      icon: 'Brain',
      tags: ['AI', 'Learning', 'Community'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  activityEvents: {},
  coreTeam: [],
};

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function normalizePrivateKey(k) {
  return k.includes('\\n') ? k.replace(/\\n/g, '\n') : k;
}

async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}

async function readContent() {
  await ensureContentFile();
  const raw = await fs.readFile(CONTENT_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeContent(content) {
  await ensureContentFile();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
}

async function supabaseRequest(pathname, { method = 'GET', body } = {}) {
  if (!HAS_SUPABASE) throw new Error('Supabase is not configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? 'count=exact' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

function parseBearer(authHeader = '') {
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
}

function adminAuth(req, res, next) {
  const bearer = parseBearer(req.headers.authorization || '');
  if (!bearer || !sessions.has(bearer)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminSession = sessions.get(bearer);
  return next();
}

function toSafeString(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function sanitizeHtml(str) {
  return String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function validateWhatsApp(str) {
  const v = String(str || '').trim();
  if (!/^\d{10}$/.test(v)) throw new Error('WhatsApp must be exactly 10 digits');
  return v;
}

function validateSection(str) {
  const v = String(str || '').trim().toUpperCase();
  if (!/^[A-Z]$/.test(v)) throw new Error('Section must be a single letter (A-Z)');
  return v;
}

function sanitizeEvent(input = {}) {
  const status = input.status === 'upcoming' ? 'upcoming' : 'completed';
  const tags = Array.isArray(input.tags)
    ? input.tags.map(t => toSafeString(t, 40)).filter(Boolean).slice(0, 12)
    : String(input.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 12);

  return {
    id: toSafeString(input.id || input.shortName || input.name, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `event-${Date.now()}`,
    name: toSafeString(input.name, 120),
    shortName: toSafeString(input.shortName || input.name, 60),
    date: toSafeString(input.date, 80),
    description: toSafeString(input.description, 1200),
    status,
    icon: toSafeString(input.icon || 'Pin', 32),
    tags,
  };
}

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

async function canManageActivityEvent({ name, email, phone, password }) {
  const expectedPassword = process.env.ADMIN_EVENT_PASSWORD || 'Admin@123';
  if (String(password || '') !== expectedPassword) return false;
  const n = String(name || '').trim().toLowerCase();
  const e = String(email || '').trim().toLowerCase();
  const p = normalizePhone(phone);

  const members = await listCoreTeamStore();
  return members.some(m =>
    m.name.toLowerCase() === n &&
    m.email.toLowerCase() === e &&
    normalizePhone(m.whatsapp) === p
  );
}

async function listEventsStore() {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest('events?select=*&order=created_at.desc');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      shortName: r.short_name || r.shortName || r.name,
      date: r.date_text || r.date,
      description: r.description,
      status: r.status,
      icon: r.icon || 'Pin',
      tags: Array.isArray(r.tags) ? r.tags : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
  const content = await readContent();
  return content.events || [];
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
      [row] = await supabaseRequest('events', { method: 'POST', body: [payload] });
    } catch (e) {
      // Retry with suffix if id collision occurs.
      payload = { ...payload, id: `${event.id}-${Date.now()}` };
      [row] = await supabaseRequest('events', { method: 'POST', body: [payload] });
    }
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      date: row.date_text,
      description: row.description,
      status: row.status,
      icon: row.icon || 'Pin',
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  const content = await readContent();
  content.events.unshift({ ...event, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await writeContent(content);
  return content.events[0];
}

async function updateEventStore(id, patch) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest(`events?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
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
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      date: row.date_text,
      description: row.description,
      status: row.status,
      icon: row.icon || 'Pin',
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  const content = await readContent();
  const idx = content.events.findIndex(e => e.id === id);
  if (idx < 0) return null;
  content.events[idx] = { ...content.events[idx], ...patch, id, updatedAt: new Date().toISOString() };
  await writeContent(content);
  return content.events[idx];
}

async function deleteEventStore(id) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(`events?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return Array.isArray(rows) && rows.length > 0;
  }
  const content = await readContent();
  const before = content.events.length;
  content.events = content.events.filter(e => e.id !== id);
  if (content.events.length === before) return false;
  await writeContent(content);
  return true;
}

async function listActivityEventsStore(activityKey) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(`activity_events?activity_key=eq.${encodeURIComponent(activityKey)}&select=*&order=created_at.desc`);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      date: r.date_text || r.date,
      tagline: r.tagline,
      description: r.description,
      status: r.status || 'completed',
      createdAt: r.created_at,
    }));
  }
  const content = await readContent();
  return content.activityEvents?.[activityKey] || [];
}

async function createActivityEventStore(activityKey, event) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest('activity_events', {
      method: 'POST',
      body: [{
        id: event.id,
        activity_key: activityKey,
        name: event.name,
        date_text: event.date,
        tagline: event.tagline,
        description: event.description,
        status: event.status,
        created_by_name: event.createdBy?.name || '',
        created_by_email: event.createdBy?.email || '',
        created_by_phone: event.createdBy?.phone || '',
      }],
    });
    return {
      id: row.id,
      name: row.name,
      date: row.date_text,
      tagline: row.tagline,
      description: row.description,
      status: row.status || 'completed',
      createdAt: row.created_at,
    };
  }
  const content = await readContent();
  content.activityEvents = content.activityEvents || {};
  content.activityEvents[activityKey] = content.activityEvents[activityKey] || [];
  content.activityEvents[activityKey].unshift(event);
  await writeContent(content);
  return event;
}

async function deleteActivityEventStore(activityKey, eventId) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(`activity_events?activity_key=eq.${encodeURIComponent(activityKey)}&id=eq.${encodeURIComponent(eventId)}`, { method: 'DELETE' });
    return Array.isArray(rows) && rows.length > 0;
  }
  const content = await readContent();
  content.activityEvents = content.activityEvents || {};
  const list = content.activityEvents[activityKey] || [];
  const next = list.filter(e => e.id !== eventId);
  if (next.length === list.length) return false;
  content.activityEvents[activityKey] = next;
  await writeContent(content);
  return true;
}

async function listCoreTeamStore() {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest('core_team_members?select=*&order=created_at.asc');
    return rows.map(r => ({
      id: r.id, name: r.name, role: r.role, year: r.year,
      branch: r.branch, section: r.section, email: r.email,
      whatsapp: r.whatsapp, linkedin: r.linkedin, instagram: r.instagram,
      photoUrl: r.photo_url, createdAt: r.created_at
    }));
  }
  const content = await readContent();
  return content.coreTeam || [];
}

async function createCoreTeamStore(member) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest('core_team_members', {
      method: 'POST',
      body: [{
        name: member.name, role: member.role, year: member.year,
        branch: member.branch, section: member.section, email: member.email,
        whatsapp: member.whatsapp, linkedin: member.linkedin,
        instagram: member.instagram, photo_url: member.photoUrl
      }]
    });
    return {
      id: row.id, name: row.name, role: row.role, year: row.year,
      branch: row.branch, section: row.section, email: row.email,
      whatsapp: row.whatsapp, linkedin: row.linkedin, instagram: row.instagram,
      photoUrl: row.photo_url, createdAt: row.created_at
    };
  }
  const content = await readContent();
  content.coreTeam = content.coreTeam || [];
  const newMember = { ...member, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  content.coreTeam.push(newMember);
  await writeContent(content);
  return newMember;
}

async function deleteCoreTeamStore(id) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(`core_team_members?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return Array.isArray(rows) && rows.length > 0;
  }
  const content = await readContent();
  content.coreTeam = content.coreTeam || [];
  const before = content.coreTeam.length;
  content.coreTeam = content.coreTeam.filter(m => String(m.id) !== String(id));
  if (content.coreTeam.length === before) return false;
  await writeContent(content);
  return true;
}

async function appendToSupabaseForms(formType, payload) {
  if (!HAS_SUPABASE) return false;
  try {
    await supabaseRequest('form_submissions', {
      method: 'POST',
      body: [{
        form_type: formType,
        full_name: toSafeString(payload.fullName, 140),
        college_email: toSafeString(payload.collegeEmail, 140),
        whatsapp: toSafeString(payload.whatsapp, 40),
        payload,
      }],
    });
    return true;
  } catch {
    return false;
  }
}

async function appendFormToSheet(formType, payload) {
  const clientEmail = requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(requiredEnv('GOOGLE_PRIVATE_KEY'));
  const spreadsheetId = requiredEnv('GOOGLE_SHEET_ID');

  const defaultTab = process.env.GOOGLE_SHEET_TAB_NAME || 'Responses';
  const tabMap = {
    membership: process.env.GOOGLE_MEMBERSHIP_TAB_NAME || 'MembershipResponses',
    recruitment: process.env.GOOGLE_RECRUITMENT_TAB_NAME || 'RecruitmentResponses',
    core_team: process.env.GOOGLE_CORE_TEAM_TAB_NAME || 'CoreTeamResponses',
  };
  const sheetName = tabMap[formType] || defaultTab;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const now = new Date().toISOString();
  const row = [
    now,
    formType,
    toSafeString(payload.fullName, 140),
    toSafeString(payload.collegeEmail, 140),
    toSafeString(payload.whatsapp, 40),
    JSON.stringify(payload),
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
  return /^[+()\-\s0-9]{8,20}$/.test(v);
}

app.get('/healthz', async (req, res) => {
  const events = await listEventsStore();
  res.json({ ok: true, events: events.length, storage: HAS_SUPABASE ? 'supabase' : 'file' });
});

app.get('/api/content/events', async (req, res) => {
  try {
    return res.json({ events: await listEventsStore() });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load events' });
  }
});

app.get('/api/content/activity-events/:activityKey', async (req, res) => {
  try {
    const activityKey = toSafeString(req.params.activityKey, 80);
    return res.json({ events: await listActivityEventsStore(activityKey) });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load activity events' });
  }
});

app.post('/api/content/activity-events/:activityKey', async (req, res) => {
  try {
    const activityKey = toSafeString(req.params.activityKey, 80);
    const body = req.body || {};
    const auth = { name: body.name, email: body.email, phone: body.phone, password: body.password };
    if (!(await canManageActivityEvent(auth))) {
      return res.status(401).json({ error: 'Unauthorized. Core team details or password did not match.' });
    }

    const event = {
      id: `manual-${Date.now()}`,
      name: toSafeString(body.eventName, 120),
      date: toSafeString(body.eventDate, 80),
      tagline: toSafeString(body.eventTagline, 240),
      description: toSafeString(body.eventDescription, 1200),
      status: 'completed',
      createdAt: new Date().toISOString(),
      createdBy: {
        name: toSafeString(body.name, 120),
        email: toSafeString(body.email, 140),
        phone: normalizePhone(body.phone),
      },
    };
    if (!event.name || !event.date || !event.description) {
      return res.status(400).json({ error: 'Event name, date and description are required.' });
    }

    await createActivityEventStore(activityKey, event);
    return res.status(201).json({ ok: true, event });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to add activity event' });
  }
});

app.delete('/api/content/activity-events/:activityKey/:eventId', async (req, res) => {
  try {
    const activityKey = toSafeString(req.params.activityKey, 80);
    const eventId = toSafeString(req.params.eventId, 120);
    const body = req.body || {};
    const auth = { name: body.name, email: body.email, phone: body.phone, password: body.password };
    if (!(await canManageActivityEvent(auth))) {
      return res.status(401).json({ error: 'Unauthorized. Core team details or password did not match.' });
    }

    const deleted = await deleteActivityEventStore(activityKey, eventId);
    if (!deleted) return res.status(404).json({ error: 'Event not found in manual activity events.' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to delete activity event' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const u = String(req.body?.username || '').trim();
  const p = String(req.body?.password || '');

  if (u !== username || p !== password) return res.status(401).json({ error: 'Invalid credentials' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { username: u, createdAt: Date.now() });
  return res.json({ token, username: u });
});

app.get('/api/admin/events', adminAuth, async (req, res) => {
  return res.json({ events: await listEventsStore() });
});

app.post('/api/admin/events', adminAuth, async (req, res) => {
  try {
    const event = sanitizeEvent(req.body || {});
    if (!event.name || !event.date || !event.description) {
      return res.status(400).json({ error: 'name, date and description are required' });
    }
    const saved = await createEventStore(event);
    return res.status(201).json({ ok: true, event: saved });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to create event' });
  }
});

app.put('/api/admin/events/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const patch = sanitizeEvent({ ...req.body, id });
    const updated = await updateEventStore(id, patch);
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    return res.json({ ok: true, event: updated });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to update event' });
  }
});

app.delete('/api/admin/events/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const deleted = await deleteEventStore(id);
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to delete event' });
  }
});

app.get('/api/content/core-team', async (req, res) => {
  try {
    return res.json(await listCoreTeamStore());
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load core team' });
  }
});

app.get('/api/admin/core-team', adminAuth, async (req, res) => {
  try {
    return res.json(await listCoreTeamStore());
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load core team' });
  }
});

app.post('/api/admin/core-team', adminAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const adminEmail = req.adminSession?.username || 'admin';
    
    const member = {
      name: sanitizeHtml(toSafeString(body.name, 100)),
      role: sanitizeHtml(toSafeString(body.role, 100)),
      year: sanitizeHtml(toSafeString(body.year, 20)),
      branch: sanitizeHtml(toSafeString(body.branch, 100)),
      section: validateSection(body.section),
      email: toSafeString(body.email, 140),
      whatsapp: validateWhatsApp(body.whatsapp),
      linkedin: toSafeString(body.linkedin, 255) || null,
      instagram: toSafeString(body.instagram, 255) || null,
      photoUrl: toSafeString(body.photoUrl, 500) || null,
    };
    
    if (!member.name || !member.role || !member.year || !member.branch || !member.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!isEmail(member.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const saved = await createCoreTeamStore(member);
    adminEvents.emit('CORE_TEAM_MEMBER_ADDED', { adminEmail, member: saved, timestamp: new Date().toISOString() });
    
    return res.status(201).json(saved);
  } catch (e) {
    return res.status(400).json({ error: e?.message || 'Validation failed' });
  }
});

app.delete('/api/admin/core-team/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const adminEmail = req.adminSession?.username || 'admin';
    
    const deleted = await deleteCoreTeamStore(id);
    if (!deleted) return res.status(404).json({ error: 'Member not found' });
    
    adminEvents.emit('CORE_TEAM_MEMBER_REMOVED', { adminEmail, memberId: id, timestamp: new Date().toISOString() });
    
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to delete member' });
  }
});

async function handleForm(formType, req, res) {
  try {
    const body = req.body || {};
    if (!toSafeString(body.fullName, 120)) return res.status(400).json({ error: 'fullName is required' });
    if (!isEmail(body.collegeEmail)) return res.status(400).json({ error: 'Invalid email address' });
    if (!isPhoneish(body.whatsapp)) return res.status(400).json({ error: 'Invalid contact number' });

    const savedToSupabase = await appendToSupabaseForms(formType, body);
    try {
      await appendFormToSheet(formType, body);
    } catch (sheetErr) {
      if (!savedToSupabase) throw sheetErr;
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Submission failed' });
  }
}

app.post('/api/forms/membership', (req, res) => handleForm('membership', req, res));
app.post('/api/forms/recruitment', (req, res) => handleForm('recruitment', req, res));
app.post('/api/core-team/apply', (req, res) => handleForm('core_team', req, res));

const port = Number(process.env.PORT || 8787);
if (!process.env.VERCEL) {
  const boot = HAS_SUPABASE ? Promise.resolve() : ensureContentFile();
  boot.then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`NexaSphere server listening on http://localhost:${port}`);
    });
  });
} else {
  // Vercel/Render style deployments rely on the platform to start the server.
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`NexaSphere server listening on http://localhost:${port}`);
  });
}

export default app;
