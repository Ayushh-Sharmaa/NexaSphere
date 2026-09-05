import crypto from 'crypto';

const sessions = new Map();

function parseBearer(authHeader = '') {
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
}

function requireAdmin(req, res, next) {
  const bearer = parseBearer(req.headers.authorization || '');
  if (!bearer || !sessions.has(bearer)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminSession = sessions.get(bearer);
  return next();
}

function login(req, res) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const u = String(req.body?.username || '').trim();
  const p = String(req.body?.password || '');

  if (u !== username || p !== password) return res.status(401).json({ error: 'Invalid credentials' });

  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { username: u, createdAt: Date.now() });
  return res.json({ token, username: u });
}

export const adminAuthMiddleware = {
  login,
  requireAdmin,
};

