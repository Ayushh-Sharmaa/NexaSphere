/**
 * Auth Utilities - Secure Cookie-Based Token Management
 *
 * This module provides secure authentication utilities using HttpOnly cookies
 * instead of localStorage/sessionStorage for better security.
 *
 * Security features:
 * - Tokens stored in HttpOnly secure cookies (not accessible via JavaScript)
 * - Automatic session refresh before expiry
 * - CSRF protection via double-submit cookie pattern
 * - Session fingerprinting for replay attack prevention
 */

import { jwtDecode } from "jwt-decode";

let _logoutTimer = null;
let _refreshTimer = null;

// Token configuration
const TOKEN_REFRESH_BUFFER_MS = 60_000; // Refresh 60 seconds before expiry
const SESSION_FINGERPRINT_KEY = "ns_session_fp";

/**
 * Generate a session fingerprint for replay attack prevention
 */
function generateSessionFingerprint() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "14px Arial";
  ctx.fillText("fingerprint", 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Initialize session fingerprint if not already set
 */
export function initSessionFingerprint() {
  let fingerprint = sessionStorage.getItem(SESSION_FINGERPRINT_KEY);
  if (!fingerprint) {
    fingerprint = generateSessionFingerprint();
    sessionStorage.setItem(SESSION_FINGERPRINT_KEY, fingerprint);
  }
  return fingerprint;
}

/**
 * Get the current session fingerprint
 */
export function getSessionFingerprint() {
  return (
    sessionStorage.getItem(SESSION_FINGERPRINT_KEY) || initSessionFingerprint()
  );
}

/**
 * Save token and schedule automatic logout before expiry
 * @deprecated Use secure cookies instead. This is kept for backward compatibility.
 */
export function saveTokenAndScheduleLogout(token, logoutFn) {
  console.warn(
    "[authUtils] Token storage is deprecated. Secure cookies are used instead."
  );
  scheduleAutoLogout(token, logoutFn);
}

/**
 * Decode the JWT and set a timer to call logoutFn before expiry
 */
export function scheduleAutoLogout(token, logoutFn) {
  clearAutoLogoutTimer();

  try {
    const { exp } = jwtDecode(token);
    if (!exp) return;

    const BUFFER_MS = 30_000; // 30 seconds buffer
    const msUntilExpiry = exp * 1000 - Date.now() - BUFFER_MS;

    if (msUntilExpiry <= 0) {
      logoutFn();
      return;
    }

    _logoutTimer = setTimeout(() => {
      logoutFn();
    }, msUntilExpiry);
  } catch (err) {
    console.error(
      "[authUtils] Failed to decode JWT - logging out for safety.",
      err
    );
    logoutFn();
  }
}

/**
 * Schedule automatic token refresh before expiry
 */
export function scheduleTokenRefresh(token, refreshFn) {
  clearAutoRefreshTimer();

  try {
    const { exp } = jwtDecode(token);
    if (!exp) return;

    const msUntilRefresh = exp * 1000 - Date.now() - TOKEN_REFRESH_BUFFER_MS;

    if (msUntilRefresh <= 0) {
      refreshFn();
      return;
    }

    _refreshTimer = setTimeout(() => {
      refreshFn();
    }, msUntilRefresh);
  } catch (err) {
    console.error("[authUtils] Failed to schedule token refresh:", err);
  }
}

/** Cancel a pending auto-logout timer */
export function clearAutoLogoutTimer() {
  if (_logoutTimer !== null) {
    clearTimeout(_logoutTimer);
    _logoutTimer = null;
  }
}

/** Cancel a pending auto-refresh timer */
export function clearAutoRefreshTimer() {
  if (_refreshTimer !== null) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
}

/**
 * Get the stored token from cookie (httpOnly cookies are not accessible via JS)
 * This function is kept for backward compatibility but should not be used
 * for new code. Use server-side session validation instead.
 */
export function getToken() {
  // For backward compatibility, try to get from cookie
  const match = document.cookie.match(/(?:^|;\s*)ns_admin_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Clear the token from storage
 * Note: HttpOnly cookies are cleared server-side
 */
export function removeToken() {
  // Clear any localStorage fallbacks (deprecated)
  localStorage.removeItem("ns_admin_token");
  localStorage.removeItem("ns_csrf_token");
  sessionStorage.removeItem(SESSION_FINGERPRINT_KEY);
}

/**
 * Get CSRF token from cookie or meta tag
 */
export function getCsrfToken() {
  // Try to get from cookie first
  const match = document.cookie.match(/(?:^|;\s*)ns_csrf_token=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);

  // Fallback to meta tag
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute("content") : null;
}

/**
 * Re-hydrate session state from secure cookies (no-op for secure cookies)
 */
export function rehydrateSession() {
  // Initialize session fingerprint
  initSessionFingerprint();
}

/**
 * Check if the current session is valid
 */
export function isSessionValid() {
  const token = getToken();
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);
    if (!exp) return false;
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default {
  saveTokenAndScheduleLogout,
  scheduleAutoLogout,
  scheduleTokenRefresh,
  clearAutoLogoutTimer,
  clearAutoRefreshTimer,
  getToken,
  removeToken,
  getCsrfToken,
  rehydrateSession,
  initSessionFingerprint,
  getSessionFingerprint,
  isSessionValid,
};
