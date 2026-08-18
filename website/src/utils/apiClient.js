import * as Sentry from '@sentry/react';
import { cacheGet, cacheSet, CACHE_KEYS, TTL } from './indexedDB.js';
import { enqueueRequest } from './offlineQueue.js';

/**
 * Standardized API Error class for handling API request failures.
 *
 * Extends the native Error class to include HTTP status, error codes,
 * and the original error for debugging purposes.
 *
 * @example
 * throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
 */
export class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   *
   * @param {string} message - Human-readable error message.
   * @param {number} status - HTTP status code (0 for network/offline errors).
   * @param {string} code - Machine-readable error code for programmatic handling.
   * @param {Error|null} originalError - The original error that caused this API error (if any).
   */
  constructor(message, status, code, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Maps a URL pathname to its IndexedDB cache key (if any).
 * Used to hydrate GET requests from IDB when offline.
 */
function getIDBCacheKey(url) {
  try {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    const pathname = new URL(url, origin).pathname;
    if (pathname.includes('/dashboard')) return CACHE_KEYS.DASHBOARD;
    if (pathname.includes('/analytics')) return CACHE_KEYS.ANALYTICS;
    if (pathname.includes('/notifications')) return CACHE_KEYS.NOTIFICATIONS;
    if (pathname.includes('/profile') || pathname.includes('/user/me'))
      return CACHE_KEYS.USER_PROFILE;
    if (pathname.includes('/events')) return CACHE_KEYS.EVENTS;
  } catch {
    // URL parse failed — no IDB key
  }
  return null;
}

/**
 * Mutating HTTP methods that should be queued when offline.
 */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function createAbortSignal(timeout, callerSignal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

  if (!callerSignal) {
    return {
      signal: timeoutController.signal,
      cleanup: () => clearTimeout(timeoutId),
    };
  }

  if (typeof AbortSignal.any === 'function') {
    return {
      signal: AbortSignal.any([timeoutController.signal, callerSignal]),
      cleanup: () => clearTimeout(timeoutId),
    };
  }

  const combinedController = new AbortController();
  const abortCombined = () => {
    if (!combinedController.signal.aborted) {
      combinedController.abort();
    }
  };

  const onTimeoutAbort = () => abortCombined();
  const onCallerAbort = () => abortCombined();

  timeoutController.signal.addEventListener('abort', onTimeoutAbort, { once: true });
  if (callerSignal.aborted) {
    abortCombined();
  } else {
    callerSignal.addEventListener('abort', onCallerAbort, { once: true });
  }

  return {
    signal: combinedController.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      timeoutController.signal.removeEventListener('abort', onTimeoutAbort);
      callerSignal.removeEventListener('abort', onCallerAbort);
    },
  };
}

/**
 * Centralized async API wrapper for fetch requests.
 *
 * Provides standardized error handling, timeout management, offline support,
 * and automatic caching for GET requests. Handles both online and offline scenarios:
 * - Online: Makes HTTP requests with timeout and abort signal support
 * - Offline + GET: Attempts to serve from IndexedDB cache
 * - Offline + mutation: Queues requests for later sync (except auth requests)
 * - Reports errors to Sentry for debugging
 *
 * @param {string} url - The API endpoint URL.
 * @param {object} [options={}] - Fetch options.
 * @param {number} [options.timeout=10000] - Request timeout in milliseconds.
 * @param {string} [options.method='GET'] - HTTP method (GET, POST, PUT, PATCH, DELETE).
 * @param {object} [options.headers] - Request headers.
 * @param {object|string} [options.body] - Request body for mutations.
 * @param {AbortSignal} [options.signal] - Abort signal for request cancellation.
 *
 * @returns {Promise<any>} The response data (JSON or text), or a queued response object for offline mutations.
 *
 * @throws {ApiError} When the request fails, times out, or cannot be served from cache.
 *
 * @example
 * // Basic GET request
 * const data = await apiClient('/api/events');
 *
 * @example
 * // POST request with timeout
 * const result = await apiClient('/api/events', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'New Event' }),
 *   headers: { 'Content-Type': 'application/json' },
 *   timeout: 15000
 * });
 */
export const apiClient = async (url, options = {}) => {
  const { timeout = 10000, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  // ── Offline handling ───────────────────────────────────────────────────────

  if (!navigator.onLine) {
    if (method === 'GET') {
      // Try to serve from IndexedDB cache
      const cacheKey = getIDBCacheKey(url);
      if (cacheKey) {
        try {
          const cached = await cacheGet(cacheKey);
          if (cached !== null) {
            console.log(`[apiClient] Offline — serving "${cacheKey}" from IndexedDB.`);
            return cached;
          }
        } catch (err) {
          console.warn('[apiClient] IDB hydration failed:', err);
        }
      }
      // No cached data available
      throw new ApiError(
        'You are offline and no cached data is available for this request.',
        0,
        'OFFLINE_NO_CACHE'
      );
    }

    if (MUTATING_METHODS.has(method)) {
      // Security: Do not queue authentication requests to avoid storing credentials in cleartext IDB
      const urlStr = String(url).toLowerCase();
      if (
        urlStr.includes('/login') ||
        urlStr.includes('/register') ||
        urlStr.includes('/auth') ||
        urlStr.includes('/reset')
      ) {
        throw new ApiError(
          'Authentication actions cannot be performed offline. Please reconnect and try again.',
          0,
          'OFFLINE_AUTH_UNSUPPORTED'
        );
      }

      // Security: Strip sensitive headers before storing in IndexedDB
      const safeHeaders = { ...(fetchOptions.headers || {}) };
      delete safeHeaders['Authorization'];
      delete safeHeaders['authorization'];
      delete safeHeaders['X-Api-Key'];
      delete safeHeaders['x-api-key'];

      // Queue the mutation for later replay
      let body;
      try {
        body = fetchOptions.body ? JSON.parse(fetchOptions.body) : undefined;
      } catch {
        body = fetchOptions.body;
      }

      // Security: Redact sensitive fields from body to avoid cleartext storage in IndexedDB
      if (body && typeof body === 'object') {
        body = { ...body };
        ['password', 'token', 'secret', 'authorization', 'apiKey'].forEach((key) => {
          if (key in body) body[key] = '[REDACTED]';
        });
      }

      const { queued, id, reason } = await enqueueRequest({
        url,
        method,
        body,
        headers: safeHeaders,
      });

      if (queued) {
        return {
          queued: true,
          id,
          offline: true,
          message:
            'You are offline. Your changes have been saved and will sync when you reconnect.',
        };
      } else if (reason === 'duplicate') {
        return {
          queued: false,
          id,
          offline: true,
          message: 'This action is already queued and will sync when you reconnect.',
        };
      }
    }
  }

  // ── Normal online fetch ────────────────────────────────────────────────────

  const callerSignal = fetchOptions.signal;
  const { signal, cleanup } = createAbortSignal(timeout, callerSignal);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
      credentials: fetchOptions.credentials ?? 'include',
    });

    if (response.type === 'opaque') {
      return null;
    }

    if (!response.ok) {
      let errorDetail = null;
      try {
        errorDetail = await response.json();
      } catch {
        // Not JSON
      }

      const message =
        errorDetail?.message || errorDetail?.error || response.statusText || 'API Request Failed';
      const code = errorDetail?.code || 'API_ERROR';

      throw new ApiError(message, response.status, code);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = await response.json();

        // Cache successful GET responses for offline viewing
        if (method === 'GET') {
          const cacheKey = getIDBCacheKey(url);
          if (cacheKey) {
            const CACHE_TTL_MAP = {
              [CACHE_KEYS.DASHBOARD]: TTL.DASHBOARD,
              [CACHE_KEYS.ANALYTICS]: TTL.ANALYTICS,
              [CACHE_KEYS.NOTIFICATIONS]: TTL.NOTIFICATIONS,
              [CACHE_KEYS.USER_PROFILE]: TTL.USER_PROFILE,
              [CACHE_KEYS.RECENTLY_VIEWED]: TTL.RECENTLY_VIEWED,
              [CACHE_KEYS.EVENTS]: TTL.EVENTS,
            };
            const ttl = CACHE_TTL_MAP[cacheKey] || 0;
            cacheSet(cacheKey, json, ttl).catch((err) => {
              console.warn('[apiClient] Failed to cache response:', err);
            });
          }
        }

        return json;
      } catch (e) {
        throw new ApiError('Malformed JSON response', 500, 'MALFORMED_JSON', e);
      }
    }

    return await response.text();
  } catch (error) {
    let standardError;
    if (error instanceof ApiError) {
      standardError = error;
    } else if (error.name === 'AbortError') {
      standardError = new ApiError('Request timed out', 408, 'TIMEOUT', error);
    } else if (!navigator.onLine) {
      // Went offline mid-request — don't report to Sentry
      standardError = new ApiError('Network connection lost', 0, 'NETWORK_ERROR', error);
    } else {
      standardError = new ApiError(error.message || 'Network failure', 0, 'NETWORK_ERROR', error);
    }

    // Only report genuine errors to Sentry (not offline / timeout)
    if (!['OFFLINE_NO_CACHE', 'NETWORK_ERROR', 'TIMEOUT'].includes(standardError.code)) {
      Sentry.captureException(standardError, {
        tags: {
          api_url: url,
          api_method: method,
        },
      });
    }

    throw standardError;
  } finally {
    cleanup();
  }
};

export default apiClient;
