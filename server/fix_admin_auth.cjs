const fs = require('fs');
let lines = fs.readFileSync('middleware/adminAuthMiddleware.js', 'utf8').split('\n');
const replacement = `async function recordLoginAttempt(ip) {
  const key = \\\`login_attempts:\${ip}\\\`;
  const client = getRedisClient();

  if (client) {
    try {
      const current = await client.get(key);
      const attempts = current ? parseInt(current, 10) : 0;
      await client.set(key, attempts + 1, { PX: LOGIN_WINDOW_MS });
      return { attempts: attempts + 1 };
    } catch (err) {
      console.error('[Redis Error] Failed to record login attempt:', err.message);
    }
  }

  const now = Date.now();
  if (loginAttemptsByIp.size >= LOGIN_MAX_TRACKED_IPS && !loginAttemptsByIp.has(ip)) {
    for (const [k, entry] of loginAttemptsByIp.entries()) {
      if (entry.expiresAt <= now) loginAttemptsByIp.delete(k);
    }
    if (loginAttemptsByIp.size >= LOGIN_MAX_TRACKED_IPS) {
      const oldestKey = loginAttemptsByIp.keys().next().value;
      if (oldestKey) loginAttemptsByIp.delete(oldestKey);
    }
  }

  const existing = loginAttemptsByIp.get(ip);
  const attempts = existing && existing.expiresAt > now ? existing.attempts : 0;
  const entry = { attempts: attempts + 1, expiresAt: now + LOGIN_WINDOW_MS };
  loginAttemptsByIp.set(ip, entry);
  return entry;
}`.replace(/\\\\`/g, '`');

const replaceLines = replacement.split('\n');
lines.splice(167, 73, ...replaceLines);
fs.writeFileSync('middleware/adminAuthMiddleware.js', lines.join('\n'));
