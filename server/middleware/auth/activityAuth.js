// Per-IP failed-attempt tracking for the activity-event auth endpoints.
// Mirrors the passkey lockout pattern used for portfolio mutations below.
const failedActivityAuthAttempts = new Map();
const ACTIVITY_AUTH_MAX_ATTEMPTS = 5;
const ACTIVITY_AUTH_LOCKOUT_MS = 15 * 60 * 1000;

export function checkActivityAuthLockout(ip) {
  const entry = failedActivityAuthAttempts.get(ip);
  if (!entry) return null;
  if (Date.now() > entry.lockoutUntil) {
    failedActivityAuthAttempts.delete(ip);
    return null;
  }
  return entry;
}

export function recordFailedActivityAuth(ip) {
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

export function clearActivityAuthAttempts(ip) {
  failedActivityAuthAttempts.delete(ip);
}
