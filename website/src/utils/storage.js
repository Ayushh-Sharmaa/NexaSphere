/**
 * Namespaced, quota-safe storage wrapper.
 *
 * `useLocalStorage` already handles the React side of persistence, but the
 * app also writes localStorage directly in several places (`main.jsx`,
 * `useAnalytics.js`, `useAdvancedSearch.js`). This module centralises those
 * raw calls: keys are namespaced, JSON (de)serialisation is automatic, values
 * can carry a TTL, and every operation degrades to an in-memory store instead
 * of throwing when localStorage is unavailable or full.
 */

const DEFAULT_PREFIX = 'nexasphere';

/**
 * Builds a storage adapter bound to a key prefix.
 *
 * @param {string} [prefix=DEFAULT_PREFIX] - Namespace prepended to every key.
 * @param {Storage|null} [backing=null] - The storage engine to wrap. Defaults
 *   to `window.localStorage`; when unavailable, an in-memory map is used.
 * @returns {StorageAdapter} The namespaced adapter.
 */
export function createStorage(prefix = DEFAULT_PREFIX, backing = null) {
  const engine = backing || resolveEngine();
  const memory = new Map();
  const enabled = engine != null;

  const fullKey = (key) => `${prefix}:${key}`;

  const read = (key) => (enabled ? engine.getItem(fullKey(key)) : memory.get(fullKey(key)) ?? null);
  const write = (key, value) => {
    if (enabled) engine.setItem(fullKey(key), value);
    else memory.set(fullKey(key), value);
  };
  const removeKey = (key) => {
    if (enabled) engine.removeItem(fullKey(key));
    else memory.delete(fullKey(key));
  };

  return {
    /**
     * Reads a raw string value. Returns `null` when missing.
     */
    get: (key) => read(key),

    /**
     * Writes a raw string value.
     */
    set: (key, value) => write(key, String(value)),

    /**
     * Reads and parses a JSON value, returning `fallback` on any failure.
     *
     * @param {string} key - Storage key.
     * @param {*} [fallback=null] - Value returned when missing/invalid.
     * @returns {*} Parsed value.
     */
    getJSON: (key, fallback = null) => {
      const raw = read(key);
      if (raw == null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },

    /**
     * Serialises and writes a JSON value.
     *
     * @param {string} key - Storage key.
     * @param {*} value - Value to serialise.
     */
    setJSON: (key, value) => write(key, JSON.stringify(value)),

    /**
     * Writes a value that expires after `ttl` milliseconds. Reads after
     * expiry return `fallback` and purge the entry.
     *
     * @param {string} key - Storage key.
     * @param {*} value - Value to store.
     * @param {number} ttl - Time-to-live in milliseconds.
     */
    setJSONWithTTL: (key, value, ttl) => {
      const expiresAt = Date.now() + ttl;
      write(
        key,
        JSON.stringify({
          __nexa_ttl: expiresAt,
          __nexa_value: value,
        })
      );
    },

    /**
     * Reads a TTL-wrapped value, expiring it when past its deadline.
     *
     * @param {string} key - Storage key.
     * @param {*} [fallback=null] - Value returned when missing/expired.
     * @returns {*} Stored value or fallback.
     */
    getJSONWithTTL: (key, fallback = null) => {
      const raw = read(key);
      if (raw == null) return fallback;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.__nexa_ttl === 'number') {
          if (Date.now() > parsed.__nexa_ttl) {
            removeKey(key);
            return fallback;
          }
          return parsed.__nexa_value;
        }
        return parsed;
      } catch {
        return fallback;
      }
    },

    /**
     * Removes a single key.
     */
    remove: (key) => removeKey(key),

    /**
     * Removes every key belonging to this adapter's namespace.
     */
    clear: () => {
      if (enabled) {
        const target = `${prefix}:`;
        const doomed = [];
        for (let i = 0; i < engine.length; i += 1) {
          const k = engine.key(i);
          if (k != null && k.startsWith(target)) doomed.push(k);
        }
        doomed.forEach((k) => engine.removeItem(k));
      } else {
        memory.clear();
      }
    },

    /**
     * Whether the adapter is backed by real storage or the memory fallback.
     */
    isPersistent: () => enabled,
  };
}

/**
 * Returns `window.localStorage` when usable, otherwise `null`.
 */
function resolveEngine() {
  if (typeof window === 'undefined') return null;
  try {
    const probe = `${DEFAULT_PREFIX}:__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Default adapter using the standard `nexasphere` namespace.
 */
export const storage = createStorage();

export default storage;
