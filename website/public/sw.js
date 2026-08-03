/**
 * NexaSphere Custom Service Worker Additions
 * ============================================
 * This file is NOT the main service worker — Workbox (via vite-plugin-pwa)
 * auto-generates the main sw. This file handles:
 *
 *  - Push notifications
 *  - Notification click / close handling
 *  - Background sync tag 'ns-bg-sync' — triggers app-side sync queue processing
 *
 * NOTE: The main Workbox SW handles all caching strategies (configured in vite.config.js).
 * The old hand-rolled cache logic has been replaced by Workbox's production-grade caching.
 */

// ── Background Sync ───────────────────────────────────────────────────────────

/**
 * Background Sync event — triggered when connectivity is restored.
 * Sends a message to all controlled clients to trigger the app-side sync queue.
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'ns-bg-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: false }).then((clients) => {
      .catch(err => console.error(err))