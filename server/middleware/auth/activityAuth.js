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

import {
  timingSafeStringEqual,
  normalizePhone,
  listCoreTeamStore,
} from '../../repositories/contentStore.js';

export async function canManageActivityEvent({ name, email, phone, password }) {
  const expectedPassword = process.env.ADMIN_EVENT_PASSWORD;
  // Use constant-time comparison to prevent timing-based password recovery.
  if (!timingSafeStringEqual(String(password ?? ''), expectedPassword)) {
    return false;
  }
  const n = String(name || '')
    .trim()
    .toLowerCase();
  const e = String(email || '')
    .trim()
    .toLowerCase();
  const p = normalizePhone(phone);

  const members = await listCoreTeamStore();
  return members.some(
    (m) =>
      m.name.toLowerCase() === n && m.email.toLowerCase() === e && normalizePhone(m.whatsapp) === p
  );
}
