/**
 * Centralized localStorage / sessionStorage key constants.
 *
 * All reads and writes to browser storage MUST use these constants
 * to prevent key-string drift across files (bug: syncManager was
 * using 'ns-auth-token' while StudentAuthContext wrote 'ns_student_token').
 *
 * Security note: auth tokens stored in localStorage are readable by
 * any JS on the page. Long-term goal: migrate to httpOnly cookies.
 * For now, using this central registry ensures consistent handling.
 *
 * @example
 * import { STORAGE_KEYS } from './utils/storageKeys.js';
 * const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
 */
export const STORAGE_KEYS = {
  /**
   * JWT authentication token issued by the backend /api/auth endpoint.
   *
   * Used as a Bearer token in API request headers for authenticated requests.
   * Stored as a string containing the JWT token.
   *
   * @type {string}
   * @default 'ns_student_token'
   *
   * @example
   * localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'eyJhbGciOiJIUzI1NiIs...');
   * const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
   * JWT issued by /api/auth — deprecated for direct storage.
   * Authentication should be handled via HttpOnly cookies instead
   * of JS-readable localStorage/sessionStorage.
   */
  AUTH_TOKEN: 'ns_student_token',

  /**
   * Serialized user profile data.
   *
   * Stores the current user's profile information including id, email, name,
   * and other profile fields. Stored as a JSON string.
   *
   * @type {string}
   * @default 'ns_user'
   *
   * @example
   * const profile = { id: 123, email: 'user@example.com', name: 'John Doe' };
   * localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
   * const user = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) } catch { return null } })();
   */
  USER_PROFILE: 'ns_user',

  /**
   * Application color theme preference.
   *
   * Stores the user's selected theme for the UI. Valid values are 'light',
   * 'dark', or 'system' (follows system preference).
   *
   * @type {string}
   * @default 'ns-theme'
   *
   * @example
   * localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
   * const theme = localStorage.getItem(STORAGE_KEYS.THEME);
   */
  THEME: 'ns-theme',

  /**
   * Recent search queries for autocomplete.
   *
   * Stores the last 5 search queries entered by the user in the search bar.
   * Used to provide autocomplete suggestions. Stored as a JSON array of strings.
   *
   * @type {string}
   * @default 'recent_searches'
   *
   * @example
   * const searches = ['react', 'javascript', 'css'];
   * localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
   */
  RECENT_SEARCHES: 'recent_searches',

  /**
   * Saved search configurations.
   *
   * Stores user-saved search configurations including query, filters, and timestamp.
   * Allows users to save and reuse complex search filters. Stored as a JSON array
   * of objects.
   *
   * @type {string}
   * @default 'saved_searches'
   *
   * @example
   * const savedSearch = { query: 'events', filters: { category: 'tech' }, timestamp: 1234567890 };
   * localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify([savedSearch]));
   */
  SAVED_SEARCHES: 'saved_searches',

  /**
   * Moderation flagged content cache.
   *
   * Stores content that has been flagged for moderation review by administrators.
   * Used to maintain a local cache of the moderation review queue. Stored as
   * a JSON array of flagged content objects.
   *
   * @type {string}
   * @default 'moderation_flagged'
   *
   * @example
   * const flagged = [{ id: 1, reason: 'inappropriate', status: 'pending' }];
   * localStorage.setItem(STORAGE_KEYS.MODERATION_FLAGGED, JSON.stringify(flagged));
   */
  MODERATION_FLAGGED: 'moderation_flagged',
};

export default STORAGE_KEYS;
