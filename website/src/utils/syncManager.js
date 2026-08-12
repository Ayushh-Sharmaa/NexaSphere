import logger from './logger.js';
/**
 * Background Sync Manager for NexaSphere
 * ========================================
 * Orchestrates offline request replay when the network is restored.
 *
 * Features:
 *  - Listens to window 'online' events
 *  - Replays queued requests sequentially (oldest first)
 *  - Exponential backoff: min(1000 * 2^retryCount, 30000) ms
 *  - Max 5 retries per request; marks failed after that
 *  - isSyncing flag prevents concurrent sync runs
 *  - Emits DOM events for UI feedback
 *  - Attempts SW Background Sync API when supported
 *
 * DOM events emitted on window:
 *  nexasphere:sync-start     — sync run began
 *  nexasphere:sync-progress  — { detail: { completed, total, currentUrl } }
 *  nexasphere:sync-complete  — { detail: { synced, failed } }
 *  nexasphere:sync-failed    — { detail: { id, url, error } }
 *  nexasphere:queue-change   — queue size changed (from offlineQueue)
 */

import { getQueue, removeFromQueue, updateRetryCount } from './offlineQueue.js';
import { STORAGE_KEYS } from './storageKeys.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

// ── State ─────────────────────────────────────────────────────────────────────

let isSyncing = false;
let isInitialized = false;
let _pendingSync = false; // if another online event fired during sync

// ── Backoff helper ────────────────────────────────────────────────────────────

function backoffMs(retryCount) {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Event helpers ─────────────────────────────────────────────────────────────

function emit(name, detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {
    // Not in browser
  }
}

// ── Replay a single queued request ────────────────────────────────────────────

/**
 * Replays one queued request against the network.
 * Returns { success: boolean, shouldRetry: boolean }
 */
async function replayRequest(entry) {
  const { id, url, method, body, headers } = entry;

  // Re-attach auth token from current session (localStorage only —
  // auth tokens must never be stored in sessionStorage due to tab isolation issues).
  const authHeaders = {};
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // storage unavailable
  }

  const fetchOptions = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = body; // already JSON-serialized string
  }

  // Validate URL to prevent Client-Side SSRF / Malicious redirect injections
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsedUrl = new URL(url);
      const allowedHost = window.location.host;
      // Restrict targeting to identical hosts / loopback protections
      if (
        parsedUrl.host !== allowedHost &&
        !parsedUrl.hostname.endsWith('.api.nexasphere.internal')
      ) {
        const isLocalIp =
          /(^127\.)|(^192\.168\.)|(^10\.)|(^172\.(1[6-9]|2[0-9]|3[0-1])\.)|(^::1$)|(^169\.254\.)/.test(
            parsedUrl.hostname
          );
        if (isLocalIp || parsedUrl.hostname === 'localhost') {
          console.error('Blocked potential SSRF target payload:', parsedUrl.hostname);
          return { success: false, shouldRetry: false };
        }
      }
    } else if (url.startsWith('//')) {
      return { success: false, shouldRetry: false };
    }
  } catch (e) {
    return { success: false, shouldRetry: false };
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    // 4xx = permanent failure (don't retry); 5xx = transient (retry)
    const shouldRetry = response.status >= 500;
    return { success: false, shouldRetry };
  }

  return { success: true, shouldRetry: false };
}

// ── Core sync runner ──────────────────────────────────────────────────────────

/**
 * Processes the entire sync queue sequentially.
 * Handles retries and exponential backoff.
 */
async function runSync() {
  if (isSyncing) {
    _pendingSync = true;
    return;
  }

  const queue = await getQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  _pendingSync = false;

  emit('nexasphere:sync-start');
  logger.info(`[SyncManager] Starting sync — ${queue.length} request(s) queued.`);

  let synced = 0;
  let failed = 0;
  const total = queue.length;

  for (const entry of queue) {
    const { url, method, retryCount } = entry;
    const id = entry.id;

    // Apply backoff delay for retries
    if (retryCount > 0) {
      await sleep(backoffMs(retryCount));
    }

    emit('nexasphere:sync-progress', {
      completed: synced,
      total,
      currentUrl: url,
    });

    try {
      const { success, shouldRetry } = await replayRequest(entry);

      if (success) {
        await removeFromQueue(id);
        synced++;
        logger.info(`[SyncManager] ✓ Synced: ${method} ${url}`);
      } else if (shouldRetry && retryCount < MAX_RETRIES) {
        await updateRetryCount(id, retryCount + 1);
        console.warn(
          `[SyncManager] ↻ Retry scheduled (${retryCount + 1}/${MAX_RETRIES}): ${method} ${url}`
        );
      } else {
        // Max retries exceeded or permanent 4xx failure
        await removeFromQueue(id);
        failed++;
        console.error(`[SyncManager] ✗ Permanently failed: ${method} ${url}`);
        emit('nexasphere:sync-failed', {
          id,
          url,
          error: 'Max retries exceeded or permanent error',
        });
      }
    } catch (err) {
      // Network still down or fetch threw
      if (retryCount < MAX_RETRIES) {
        await updateRetryCount(id, retryCount + 1);
        console.warn(`[SyncManager] ↻ Network error, will retry: ${method} ${url}`, err);
      } else {
        await removeFromQueue(id);
        failed++;
        emit('nexasphere:sync-failed', { id, url, error: err.message });
      }
    }
  }

  isSyncing = false;

  emit('nexasphere:sync-complete', { synced, failed });
  logger.info(`[SyncManager] Sync complete — ${synced} synced, ${failed} failed.`);

  // Handle queued sync request that arrived during this run
  if (_pendingSync) {
    _pendingSync = false;
    const remaining = await getQueue();
    if (remaining.length > 0) {
      runSync();
    }
  }
}

// ── SW Background Sync registration ──────────────────────────────────────────

async function tryRegisterSWSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await registration.sync.register('ns-bg-sync');
      logger.info('[SyncManager] SW Background Sync registered.');
    }
  } catch (err) {
    console.warn(
      '[SyncManager] SW Background Sync unavailable, using window.online fallback.',
      err
    );
  }
}

// ── Online event handler ──────────────────────────────────────────────────────

function handleOnline() {
  logger.info('[SyncManager] Connection restored — triggering sync.');
  tryRegisterSWSync(); // attempt SW sync first
  runSync(); // also trigger app-level sync immediately
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initializes the sync manager. Call once on app startup.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initSyncManager() {
  if (isInitialized) return;
  isInitialized = true;

  window.addEventListener('online', handleOnline);

  // If we're already online on init and have a queue, sync immediately
  if (navigator.onLine) {
    getQueue()
      .then((queue) => {
        if (queue.length > 0) {
          logger.info(
            `[SyncManager] Found ${queue.length} queued request(s) on startup — syncing.`
          );
          runSync();
        }
      })
      .catch((err) => console.error(err));
  }

  // Listen for SW-initiated sync messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NS_TRIGGER_SYNC') {
        runSync();
      }
    });
  }

  logger.info('[SyncManager] Initialized.');
}

/**
 * Manually triggers a sync run (e.g., user presses "Retry" button).
 */
export function triggerSync() {
  if (navigator.onLine) {
    runSync();
  } else {
    logger.info('[SyncManager] triggerSync called but offline — skipping.');
  }
}

/**
 * Tears down event listeners (useful for testing).
 */
export function destroySyncManager() {
  window.removeEventListener('online', handleOnline);
  isInitialized = false;
  isSyncing = false;
}
