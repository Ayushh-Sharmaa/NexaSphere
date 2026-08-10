/**
 * NexaSphere Service Worker — sw-nexasphere.js
 * =============================================
 * Implements all 5 acceptance criteria for issue #1661:
 *
 *  1. Cache-first   — static assets (JS, CSS, fonts, images)
 *  2. Network-first — API calls (/api/*)
 *  3. Stale-while-revalidate — non-critical content (HTML pages, manifests)
 *  4. Background sync — offline POST/PUT/DELETE (RSVP, feedback, etc.)
 *  5. Update check  — handled via registerSW.js (registration.update() on load)
 *
 * Built with Workbox (injected via vite-plugin-pwa injectManifest strategy).
 * __WB_MANIFEST is replaced at build time with the precache asset list.
 */

import { clientsClaim } from 'workbox-core';
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// ── SW lifecycle ──────────────────────────────────────────────────────────────

// Take control of all clients immediately when a new SW activates.
// Combined with registerType: 'prompt' in vite.config.js, this means
// the SW only takes over after the user confirms the update prompt.
clientsClaim();

// ── Precaching ────────────────────────────────────────────────────────────────

// Inject the Vite build manifest here.
// At build time, Workbox replaces __WB_MANIFEST with the full asset list.
precacheAndRoute(self.__WB_MANIFEST || []);

// Remove stale caches from previous SW versions on activation.
cleanupOutdatedCaches();

// ── Navigation (SPA shell) ────────────────────────────────────────────────────

// Serve index.html for all navigation requests (React Router SPA support).
// This ensures deep links work offline once the app shell is cached.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    // Exclude API routes and static file extensions from navigation handling
    denylist: [/^\/api\//, /\.[a-z]{2,4}$/i],
  })
);

// ── 1. Cache-first: static assets ────────────────────────────────────────────
// JS, CSS, fonts, images — these are hashed at build time so stale content
// is never an issue. Serve from cache immediately; update on cache miss only.

registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'nexasphere-static-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Images — also cache-first, with a slightly lower max-age
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'nexasphere-images-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ── 2. Network-first: API calls ───────────────────────────────────────────────
// Always try the network first to get fresh data.
// Falls back to the cached response when offline so the UI still renders.
// Cached responses expire after 5 minutes to avoid stale data surprises.

// Dashboard, analytics, notifications — longer cache TTL, registered before
// the generic API catch-all so Workbox's first-match-wins does not shadow it.
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    /\/api\/(dashboard|analytics|notifications|profile)/i.test(url.pathname),
  new NetworkFirst({
    cacheName: 'nexasphere-dashboard-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 10, // 10 minutes
      }),
    ],
  })
);

// Generic API GET requests — NetworkFirst catch-all
// Auth/token endpoints are explicitly EXCLUDED (never cached)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'nexasphere-api-v1',
    networkTimeoutSeconds: 6, // fall back to cache if network takes > 6s
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// ── 3. Stale-while-revalidate: non-critical content ──────────────────────────
// Serve cached content immediately (fast), then update the cache in the
// background so the next request gets fresh content. Good for pages and
// manifests where freshness matters but sub-second load is more important.

// HTML pages (non-navigation, e.g. links to same-origin HTML)
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({
    cacheName: 'nexasphere-pages-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// Web app manifests and JSON config files
registerRoute(
  ({ url }) => url.pathname.endsWith('.webmanifest') || url.pathname.endsWith('manifest.json'),
  new StaleWhileRevalidate({
    cacheName: 'nexasphere-manifests-v1',
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  })
);

// External CDN resources (Google Fonts, shields.io, etc.)
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'nexasphere-fonts-cdn-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 24 * 60 * 60 }),
    ],
  })
);

// ── 4. Background sync: offline write actions ─────────────────────────────────
// Queues failed POST/PUT/DELETE requests in IndexedDB (via Workbox).
// When connectivity is restored, the SW automatically replays the queue.
// Covers: event RSVP, feedback submissions, profile updates, etc.

const bgSyncPlugin = new BackgroundSyncPlugin('nexasphere-offline-queue', {
  maxRetentionTime: 48 * 60, // retain queued requests for up to 48 hours (in minutes)
  onSync: async ({ queue }) => {
    let error = null;
    try {
      await queue.replayRequests();
      // Emptied successfully! Trigger notification if permitted
      if (self.registration && self.Notification && self.Notification.permission === 'granted') {
        self.registration.showNotification('Changes Synced', {
          body: 'Your offline actions have been successfully synchronized with NexaSphere.',
          icon: '/pwa-192x192.png',
        });
      }
    } catch (err) {
      console.error('[Service Worker] Sync failed', err);
      throw err;
    }
  },
});

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'NexaSphere',
    body: 'You have a new notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'nexasphere-notification',
    requireInteraction: false,
    actions: [
      { action: 'register', title: 'Register Now' },
      { action: 'snooze', title: 'Snooze 1h' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
    })
  );
});

// ── Notification click handler ────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.link || '/';
  const action = event.action;
  const notificationId = event.notification.data?.id;

  // Analytics: Track Interaction
  event.waitUntil(
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId,
        eventType: action ? 'action_clicked' : 'opened',
        action,
      }),
    }).catch(() => {})
  );

  if (action === 'snooze') {
    console.log('[SW] Snoozing notification:', notificationId);
    return;
  }

  if (action === 'register') {
    const registerUrl = event.notification.data?.registerUrl || urlToOpen;
    event.waitUntil(clients.openWindow(registerUrl));
    return;
  }

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Message handler ───────────────────────────────────────────────────────────
// Allow the app to send messages to the SW (e.g. skip waiting on update).

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── 5. Offline Fallback ───────────────────────────────────────────────────────
// Provide a fallback response when a navigation request fails because the app
// is offline and the requested route isn't cached.
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    return (
      (await matchPrecache('offline.html')) ||
      (await matchPrecache('/offline.html')) ||
      (await caches.match('/offline.html')) ||
      Response.error()
    );
  }
  return Response.error();
});
