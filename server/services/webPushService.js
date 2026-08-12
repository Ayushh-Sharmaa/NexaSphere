import webpush from 'web-push';
import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@nexasphere.com';

const hasVapid = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (hasVapid) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function _sendNotification(subscription, payload) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}

const webPushBreaker = circuitBreakerRegistry.register(
  'web-push',
  new CircuitBreaker(_sendNotification, {
    name: 'web-push',
    failureThreshold: 3,
    successThreshold: 2,
    coolDownPeriod: 15000,
    maxCoolDownPeriod: 120000,
  })
);

export async function sendWebPush(subscription, payload) {
  if (!hasVapid) return null;
  try {
    const result = await webPushBreaker.execute(subscription, payload);
    return result;
  } catch (err) {
    if (err.code === "CIRCUIT_OPEN") {
      return null;
    }
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { expired: true };
    }
    throw err;
  }
}

export async function sendWebPushToAll(subscriptions, payload) {
  if (!hasVapid) return [];
  const results = await Promise.allSettled(subscriptions.map((sub) => sendWebPush(sub, payload)));
  return results.map((r, i) => ({
    index: i,
    ok: r.status === 'fulfilled' && r.value && !r.value?.expired,
    expired: r.status === 'fulfilled' && r.value?.expired === true,
  }));
}

export { VAPID_PUBLIC_KEY, hasVapid };
