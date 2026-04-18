const { google } = require('googleapis');

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function normalizePrivateKey(k) {
  return k.includes('\\n') ? k.replace(/\\n/g, '\n') : k;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

function isGlBajajEmail(s) {
  const v = String(s || '').trim().toLowerCase();
  return isEmail(v) && v.endsWith('@glbajajgroup.org');
}

function isPhoneish(s) {
  const v = String(s || '').trim();
  if (!v) return false;
  return /^\d{10}$/.test(v);
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
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
    Array.isArray(payload.declarationSelected)
      ? payload.declarationSelected.join(', ')
      : (payload.declaration || ''),
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

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = await readJson(req);

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
      // Support both new and old format.
      'declaration',
    ];

    const hasNewDeclaration = body && typeof body === 'object' && body.declarationAccepted !== undefined;
    const missing = required.filter(k => !String(body[k] || '').trim());
    if (!hasNewDeclaration && missing.length) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    }

    if (!isGlBajajEmail(body.collegeEmail)) {
      return res.status(400).json({ error: 'Email must end with @glbajajgroup.org.' });
    }
    if (!isPhoneish(body.whatsapp)) return res.status(400).json({ error: 'Invalid contact number (10 digits required).' });
    if (hasNewDeclaration) {
      if (!body.declarationAccepted) return res.status(400).json({ error: 'Declaration not accepted.' });
      if (Array.isArray(body.declarationSelected) && body.declarationSelected.includes('disagree')) {
        return res.status(400).json({ error: 'Declaration not accepted.' });
      }
    } else {
      if (body.declaration === 'I do not agree to the above declaration.') return res.status(400).json({ error: 'Declaration not accepted.' });
    }

    await appendToSheet(body);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e && e.message ? e.message : 'Server error' });
  }
};

