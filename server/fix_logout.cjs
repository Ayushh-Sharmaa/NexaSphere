const fs = require('fs');
let lines = fs.readFileSync('middleware/adminAuthMiddleware.js', 'utf8').split('\n');

const correctLogout = `async function logout(req, res) {
  try {
    const token = req.cookies?.ns_admin_token || getCookie(req, 'ns_admin_token') || parseBearer(req.headers.authorization || '');
    if (token) {
      // Revoke from PostgreSQL audit store
      await revokeAdminSession(token);

      // Delete from shared Redis immediately
      try {
        const tokenHash = hashToken(token);
        const redisKey = REDIS_SESSION_PREFIX + tokenHash;
        const redis = getRedisClient();
        await redis?.del(redisKey);
      } catch (redisErr) {
        console.error('[Admin Logout] Failed to delete session from Redis:', redisErr);
      }
    } else {
      // In case logout is called without authentication
      return res.status(401).json({ error: 'No active session to revoke' });
    }

    // Destroy express-session
    if (req.session && typeof req.session.destroy === 'function') {
      req.session.destroy((err) => {
        if (err) console.error('[Session] Error destroying session:', err);
      });
    }

    res.clearCookie('ns_admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Unable to revoke admin session" });
  }
}`.split('\n');

let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function logout(req, res) {')) {
    start = i;
    break;
  }
}

let end = -1;
for (let i = start; i < lines.length; i++) {
  if (lines[i].includes('async function getSecurityOverview')) {
    end = i - 2;
    break;
  }
}

if (start !== -1 && end !== -1) {
  lines.splice(start, end - start + 1, ...correctLogout);
  fs.writeFileSync('middleware/adminAuthMiddleware.js', lines.join('\n'));
} else {
  console.log("Could not find bounds", start, end);
}
