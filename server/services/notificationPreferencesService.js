import { notificationPreferencesRepository } from '../repositories/notificationPreferencesRepository.js';

function timeToMinutes(t) {
  if (!t) return null;
  // t expected as 'HH:MM:SS' or 'HH:MM'
  const parts = String(t)
    .split(':')
    .map((p) => parseInt(p, 10));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export async function shouldDeliver(
  userId = 'global',
  category = 'system',
  channel = 'push',
  isCritical = false
) {
  // Load user preferences
  const prefs = await notificationPreferencesRepository.list(userId);
  const map = {};
  for (const p of prefs || []) map[p.category] = p;

  const categoryPref = map[category] || null;
  const globalPref = map['global'] || null;

  // Resolve preference with global fallback
  const getEffectivePref = (key, defaultValue) => {
    if (categoryPref && categoryPref[key] !== undefined) {
      return categoryPref[key];
    }
    if (globalPref && globalPref[key] !== undefined) {
      return globalPref[key];
    }
    return defaultValue;
  };

  const pushEnabled = getEffectivePref('push', true);
  const emailEnabled = getEffectivePref('email', true);
  const smsEnabled = getEffectivePref('sms', true);

  const channelEnabled = (() => {
    if (channel === 'push') return pushEnabled;
    if (channel === 'email') return emailEnabled;
    if (channel === 'sms') return smsEnabled;
    return true;
  })();

  // If critical, deliver unless explicitly disabled in category
  const isExplicitlyDisabled = (() => {
    if (channel === 'push') return categoryPref && categoryPref.push === false;
    if (channel === 'email') return categoryPref && categoryPref.email === false;
    if (channel === 'sms') return categoryPref && categoryPref.sms === false;
    return false;
  })();

  if (isExplicitlyDisabled) {
    return { deliver: false, reason: 'channel_disabled' };
  }

  if (!channelEnabled && !isCritical) {
    return { deliver: false, reason: 'channel_disabled' };
  }

  // DND check
  const dnd = getEffectivePref('dnd', false);
  if (dnd && !isCritical) return { deliver: false, reason: 'dnd' };

  // Quiet hours
  const qs = getEffectivePref('quiet_start', null);
  const qe = getEffectivePref('quiet_end', null);
  const qStart = timeToMinutes(qs);
  const qEnd = timeToMinutes(qe);
  if (qStart !== null && qEnd !== null && !isCritical) {
    const now = nowMinutes();
    const within = qStart <= qEnd ? now >= qStart && now < qEnd : now >= qStart || now < qEnd;
    if (within) return { deliver: false, reason: 'quiet_hours' };
  }

  // Frequency
  const freq = getEffectivePref('frequency', 'immediate');

  return { deliver: true, frequency: String(freq || 'immediate') };
}

export default { shouldDeliver };
