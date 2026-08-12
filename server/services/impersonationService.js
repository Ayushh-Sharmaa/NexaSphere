const sessions = new Map();

const IMPERSONATION_TTL_MS = 30 * 60 * 1000;

function cleanupExpired() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - new Date(session.startedAt).getTime() > IMPERSONATION_TTL_MS) {
      sessions.delete(token);
    }
  }
}

// Periodically purge expired impersonation sessions every 10 minutes
if (typeof setInterval === 'function') {
  const interval = setInterval(cleanupExpired, 10 * 60 * 1000);
  if (interval && typeof interval.unref === 'function') {
    interval.unref();
  }
}

export const impersonationService = {
  start(token, targetUser) {
    cleanupExpired();
    sessions.set(token, {
      targetUser,
      startedAt: new Date().toISOString(),
    });
  },

  stop(token) {
    sessions.delete(token);
  },

  getActive(token) {
    cleanupExpired();
    return sessions.get(token) || null;
  },

  cleanupExpired,
};
