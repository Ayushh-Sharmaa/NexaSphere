const EVENTS_KEY = 'ns_db_events';
const TEAM_KEY = 'ns_db_core_team';
const ANNOUNCEMENTS_KEY = 'ns_db_announcements';
const ALLOWED_BRIDGE_KEYS = new Set([EVENTS_KEY, TEAM_KEY, ANNOUNCEMENTS_KEY]);

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function mergeById(fallbackItems, liveItems, normalize) {
  const byId = new Map();

  fallbackItems.forEach((item) => {
    const key = String(item.id ?? item.name ?? item.title);
    byId.set(key, item);
  });

  liveItems.forEach((item) => {
    const key = String(item.id ?? item.name ?? item.title);
    const previous = byId.get(key) || {};
    byId.set(key, normalize(previous, item, key));
  });

  return Array.from(byId.values());
}

export function getLocalEvents(fallbackEvents = []) {
  if (typeof window === 'undefined') return fallbackEvents;

  const stored = toArray(safeJsonParse(window.localStorage.getItem(EVENTS_KEY), []));
  if (!stored.length) return fallbackEvents;

  // Filter out events that have been tombstoned (deleted while offline)
  let tombstones = [];
  try {
    tombstones = safeJsonParse(window.localStorage.getItem('ns_tombstone_events'), []);
  } catch (e) {
    console.warn('Failed to parse tombstone events', e);
  }
  const filtered = stored.filter((event) => !tombstones.includes(String(event.id)));

  return mergeEvents(fallbackEvents, filtered);
}

export function mergeEvents(fallbackEvents = [], liveEvents = []) {
  // Tombstones are IDs of events deleted while offline. We must filter them out
  // to prevent deleted events from reappearing after sync.
  let tombstones = [];
  try {
    tombstones = safeJsonParse(window.localStorage.getItem('ns_tombstone_events'), []);
  } catch (e) {
    console.warn('Failed to parse tombstone events', e);
  }

  // Remove tombstoned events from both the cached fallback data and live server data.
  const filteredFallback = fallbackEvents.filter((event) => !tombstones.includes(String(event.id)));
  const filteredLive = liveEvents.filter((event) => !tombstones.includes(String(event.id)));

  // Merge events by ID, with live data taking priority over fallback data.
  // The spread operator order (...previous, ...event) gives live values precedence.
  return mergeById(filteredFallback, toArray(filteredLive), (previous, event, key) => ({
    ...previous,
    ...event,
    // Use live ID if available, otherwise fallback ID, or the merge key as last resort
    id: event.id ?? previous.id ?? key,
    // Name field has multiple aliases across data sources; prioritize live values
    name:
      event.name ??
      event.title ??
      event.shortName ??
      previous.name ??
      previous.title ??
      'Untitled Event',
    // Date may be stored as either dateText or date; normalize to dateText
    dateText: event.dateText ?? event.date ?? previous.dateText ?? previous.date,
    // Ensure status is always lowercase for consistent comparison
    status: String(event.status ?? previous.status ?? 'upcoming').toLowerCase(),
    // Tags may be a string or array; normalize to array format
    tags: normalizeTags(event.tags ?? previous.tags),
  }));
}

export function getLocalTeamMembers(fallbackMembers = []) {
  if (typeof window === 'undefined') return fallbackMembers;

  const stored = toArray(safeJsonParse(window.localStorage.getItem(TEAM_KEY), []));
  if (!stored.length) return fallbackMembers;

  return mergeTeamMembers(fallbackMembers, stored);
}

export function mergeTeamMembers(fallbackMembers = [], liveMembers = []) {
  return mergeById(fallbackMembers, toArray(liveMembers), (previous, member, key) => {
    const adminPhoto = member.photo;
    const adminUsesDeploymentAsset =
      typeof adminPhoto === 'string' &&
      (adminPhoto.includes('/assets/') || adminPhoto.includes('nexasphere-glbajaj.vercel.app'));

    return {
      ...previous,
      ...member,
      id: member.id ?? previous.id ?? key,
      photo:
        adminUsesDeploymentAsset && previous.photo ? previous.photo : adminPhoto || previous.photo,
      achievements: toArray(member.achievements ?? previous.achievements),
      testimonials: toArray(member.testimonials ?? previous.testimonials),
    };
  });
}

export function subscribePublicContent(callback, intervalMs = 30000) {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event) => {
    if (!event.key || event.key === EVENTS_KEY || event.key === TEAM_KEY) callback();
  };

  const onNsContentUpdated = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener('ns-content-updated', onNsContentUpdated);
  const interval = window.setInterval(callback, intervalMs);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('ns-content-updated', onNsContentUpdated);
    window.clearInterval(interval);
  };
}

/**
 * Initialize the cross-origin localStorage sync bridge.
 * Embeds an invisible iframe pointing to the admin dashboard origin
 * so that localStorage changes in the admin are relayed to this origin.
 * Only active in offline/local development mode.
 */
let bridgeInitialized = false;
let bridgeIframe = null;
let bridgeMessageHandler = null;
export function initStorageSyncBridge() {
  if (bridgeInitialized || typeof window === 'undefined') return;
  bridgeInitialized = true;

  // Read admin origin from VITE_ADMIN_DASHBOARD_URL — already defined in
  // .env.example for both local dev and production deployments.
  // Falls back to http://localhost:5001 only when running locally.
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const configuredAdminOrigin =
    import.meta.env?.VITE_ADMIN_DASHBOARD_URL ||
    (isLocal ? 'http://localhost:5001' : 'https://admin.nexasphere.com');
  const adminOrigin =
    normalizeOrigin(configuredAdminOrigin) ||
    (isLocal ? 'http://localhost:5001' : 'https://admin.nexasphere.com');
  const bridgeUrl = `${adminOrigin}/sync-bridge.html`;

  // Check if we're in a cross-origin context (different port)
  const sameOrigin = window.location.origin === adminOrigin;
  if (sameOrigin) return;

  const iframe = document.createElement('iframe');
  iframe.src = bridgeUrl;
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'NexaSphere Sync Bridge');
  iframe.tabIndex = -1;

  iframe.onload = () => {
    if (import.meta.env.DEV) {
      console.log('[StorageSync] Bridge iframe loaded from', adminOrigin);
    }
    console.log('[StorageSync] Bridge iframe loaded from', adminOrigin);
    ALLOWED_BRIDGE_KEYS.forEach((key) => {
      iframe.contentWindow?.postMessage({ type: 'ns-sync', key }, adminOrigin);
    });
  };

  iframe.onerror = () => {
    console.debug('[StorageSync] Bridge iframe failed to load — offline sync unavailable.');
  };

  document.documentElement.appendChild(iframe);
  bridgeIframe = iframe;

  // Listen for messages relayed through the bridge
  bridgeMessageHandler = (event) => {
    if (event.origin !== adminOrigin || event.source !== iframe.contentWindow) return;

    if (
      event.data &&
      event.data.type === 'ns-content-updated' &&
      ALLOWED_BRIDGE_KEYS.has(event.data.key)
    ) {
      // Update our own localStorage to match the admin's
      if (event.data.value !== null) {
        localStorage.setItem(event.data.key, event.data.value);
      } else {
        localStorage.removeItem(event.data.key);
      }
      // Fire the custom event so subscribers pick it up
      window.dispatchEvent(new Event('ns-content-updated'));
    }
  };
  window.addEventListener('message', bridgeMessageHandler);
}

/**
 * Tear down the storage sync bridge, removing the iframe and message listener.
 * Call this from a useEffect cleanup to prevent orphaned iframes.
 */
export function destroyStorageSyncBridge() {
  if (bridgeMessageHandler) {
    window.removeEventListener('message', bridgeMessageHandler);
    bridgeMessageHandler = null;
  }
  if (bridgeIframe) {
    bridgeIframe.remove();
    bridgeIframe = null;
  }
  bridgeInitialized = false;
}
