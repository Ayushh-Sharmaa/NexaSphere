/**
 * Admin Authentication Service
 *
 * Handles login, logout, session management, and token refresh.
 * Uses secure HttpOnly cookies for token storage with fallback to localStorage.
 * Supports both online (live backend) and offline (local mock) modes.
 */

import { eventEmitter, EVENTS } from "./eventEmitter";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "ns_admin_token";
const EMAIL_KEY = "ns_admin_email";
const EXPIRY_KEY = "ns_admin_token_expiry";
const OFFLINE_FLAG_KEY = "ns_offline_mode";

let _email = null;
let _role = null;
let _scopes = [];
let _impersonatingUser = null;
let refreshPromise = null;

/**
 * Generates a unique offline session token.
 * This token is only used locally and is never sent to a real backend.
 */
function generateMockToken() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Two-factor authentication helper
 */
async function finishTwoFactorRequest(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Verification failed");
  }

  const data = await res.json();
  _email = data.email || data.username || null;
  _role = data.role || null;
  _scopes = data.scopes || [];
  return data;
}

/**
 * Main auth object
 */
export const auth = {
  /**
   * Attempts to log in via the live Java backend.
   * If the server is completely unreachable and the user provides mock credentials,
   * falls back to intentional offline mode.
   */
  async login(email, password, allowOffline = false) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Invalid credentials");
      }

      const data = await res.json();

      // Handle 2FA requirements
      if (data.requiresTwoFactor || data.requiresTwoFactorSetup) {
        return data;
      }

      // Store token for backward compatibility
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.csrfToken) {
        localStorage.setItem("ns_csrf_token", data.csrfToken);
      }
      localStorage.setItem(EMAIL_KEY, cleanEmail);
      localStorage.removeItem(OFFLINE_FLAG_KEY);

      if (data.expiresAt) {
        localStorage.setItem(EXPIRY_KEY, data.expiresAt);
      }
      if (data.role) {
        localStorage.setItem("ns_admin_role", data.role);
      }
      if (data.scopes) {
        localStorage.setItem("ns_admin_scopes", JSON.stringify(data.scopes));
      }

      _email = cleanEmail;
      _role = data.role || null;
      _scopes = data.scopes || [];

      return data;
    } catch (err) {
      // Only fall back to offline mock if:
      // 1. It is a network error (server unreachable)
      // 2. User explicitly allowed offline fallback
      // 3. User provides the designated mock credentials
      const isNetworkError =
        err instanceof TypeError && err.message.toLowerCase().includes("fetch");

      if (
        isNetworkError &&
        allowOffline &&
        cleanEmail === "nexasphere@glbajajgroup.org" &&
        cleanPassword === "Admin@123"
      ) {
        if (import.meta.env.DEV) {
          console.warn(
            "[Auth] Java server unreachable - entering INTENTIONAL offline mock mode."
          );
        }
        const mockToken = generateMockToken();
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(EMAIL_KEY, cleanEmail);
        localStorage.setItem(OFFLINE_FLAG_KEY, "true");
        return { token: mockToken, email: cleanEmail, offline: true };
      }

      if (isNetworkError && !allowOffline) {
        throw new Error(
          'Server unreachable. Please check your connection or enable "Offline Mode" if you want to use the local mock database.'
        );
      }

      // Any other error (e.g. wrong credentials from live server) is rethrown
      throw err;
    }
  },

  async verifyTwoFactor(challengeToken, code) {
    return finishTwoFactorRequest("/api/admin/2fa/verify", {
      challengeToken,
      code,
    });
  },

  async verifyTwoFactorSetup(setupToken, code) {
    return finishTwoFactorRequest("/api/admin/2fa/setup/verify", {
      setupToken,
      code,
    });
  },

  async logout() {
    // Invalidate server session (cookie auth) unless offline mock mode.
    if (!this.isOfflineMode()) {
      try {
        await fetch(`${API_BASE}/api/admin/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Ignore network errors during logout
      }
    }

    _email = null;
    _role = null;
    _scopes = [];
    _impersonatingUser = null;

    // Clear all stored tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("ns_csrf_token");
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(OFFLINE_FLAG_KEY);
    localStorage.removeItem("ns_admin_role");
    localStorage.removeItem("ns_admin_scopes");

    eventEmitter.emit(EVENTS.AUTH_LOGOUT);
  },

  setImpersonating(user) {
    _impersonatingUser = user;
  },

  getImpersonating() {
    return _impersonatingUser;
  },

  clearImpersonating() {
    _impersonatingUser = null;
  },

  async refreshSession() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/api/admin/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        this.logout();
        throw new Error("Session refresh failed");
      }

      const data = await res.json();

      if (data.email) _email = data.email;
      if (data.role) _role = data.role;
      if (data.scopes) _scopes = data.scopes;

      return data;
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  },

  async verifySession() {
    // Offline sessions are always considered valid locally
    if (this.isOfflineMode()) return true;

    try {
      const res = await fetch(`${API_BASE}/api/admin/me`, {
        credentials: "include",
      });

      if (res.status === 401) {
        try {
          await this.refreshSession();
          return true;
        } catch {
          return false;
        }
      }

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.email) _email = data.email;
        if (data.role) _role = data.role;
        if (data.scopes) _scopes = data.scopes;
      }

      return res.ok;
    } catch {
      // Network error during verification - treat as unauthenticated
      return false;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getEmail() {
    return _email || localStorage.getItem(EMAIL_KEY);
  },

  getRole() {
    return _role || "SuperAdmin";
  },

  getScopes() {
    return _scopes.length > 0
      ? _scopes
      : [
          "users:read",
          "users:write",
          "settings:admin",
          "events:read",
          "events:write",
        ];
  },

  /**
   * Returns true only when the admin is using an explicit offline/mock session
   */
  isOfflineMode() {
    return localStorage.getItem(OFFLINE_FLAG_KEY) === "true";
  },

  isOffline() {
    return this.isOfflineMode();
  },
};

/**
 * Admin security operations
 */
export const adminSecurity = {
  async getOverview() {
    const res = await fetch(`${API_BASE}/api/admin/security`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Unable to load security overview");
    return res.json();
  },

  async revokeSession(sessionId) {
    const res = await fetch(
      `${API_BASE}/api/admin/security/sessions/${sessionId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Unable to revoke session");
    }
    return res.json();
  },

  async logoutOtherSessions() {
    const res = await fetch(
      `${API_BASE}/api/admin/security/sessions/logout-others`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error("Unable to logout other sessions");
    return res.json();
  },

  async searchAuditLogs(query = "") {
    const res = await fetch(
      `${API_BASE}/api/admin/audit-logs?search=${encodeURIComponent(query)}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error("Unable to load audit trail");
    return res.json();
  },

  getAuditExportUrl(query = "") {
    return `${API_BASE}/api/admin/audit-logs/export?search=${encodeURIComponent(query)}`;
  },
};

export default auth;
