import { eventEmitter, EVENTS } from './eventEmitter';
import { auth } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

// Mock DB helpers with default seeding
const getDb = (key, defaultVal) => {
  try {
    const data = localStorage.getItem(`ns_db_${key}`);
    if (data) return JSON.parse(data);
    
    // Seed initial data if empty
    if (key === 'events') {
      const initialEvents = [
        { id: '1', name: 'KSS #153 — Knowledge Sharing Session', shortName: 'KSS #153', date: 'March 14, 2025', description: "NexaSphere's inaugural Knowledge Sharing Session.", status: 'completed', icon: 'Brain', tags: ['AI', 'Learning'] },
        { id: '2', name: 'Workshop: Git & GitHub', shortName: 'Git & GitHub', date: 'April 24', description: 'Version control mastery for every developer.', status: 'upcoming', icon: 'Wrench', tags: ['Git', 'GitHub'] }
      ];
      setDb(key, initialEvents);
      return initialEvents;
    }
    if (key === 'core_team') {
      const initialTeam = [
        { id: '1', name: 'Ayush Sharma', role: 'Organiser', branch: 'CSE (AI & ML)' },
        { id: '2', name: 'Tanishk Bansal', role: 'Organiser', branch: 'CSE' },
        { id: '4', name: 'Tushar Goswami', role: 'Core Team Member', branch: 'CSE (AI & ML)' }
      ];
      setDb(key, initialTeam);
      return initialTeam;
    }
    
    return defaultVal;
  }
  catch { return defaultVal; }
};
const setDb = (key, val) => localStorage.setItem(`ns_db_${key}`, JSON.stringify(val));

// Public helper for user-facing forms to store applications into the admin db
export function storeApplicationLocally(type, application) {
  try {
    const key = type === 'membership' ? 'membership_apps' : 'coreteam_apps';
    const apps = getDb(key, []);
    const exists = apps.find(a => a.submittedAt === application.submittedAt && a.whatsapp === application.whatsapp);
    if (!exists) {
      const newApp = { ...application, id: Date.now().toString(), status: 'pending', statusUpdatedAt: null };
      setDb(key, [newApp, ...apps]);
    }
  } catch { /* ignore */ }
}

async function fetchWithAuth(url, options = {}) {
  // If we are using the mock token (offline mode), bypass fetch entirely
  const isOffline = auth.getToken() === 'mock-jwt-token-for-nexasphere-admin';
  
  if (!isOffline) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.getToken()}`,
          ...options.headers,
        },
      });

      if (res.status === 401) {
        eventEmitter.emit(EVENTS.AUTH_TOKEN_EXPIRED);
        throw new Error('Session expired');
      }
      if (res.status === 204) return null;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      return res.json();
    } catch (e) {
      console.warn('Live API failed, falling back to local storage offline mode...', e);
    }
  }

  // --- OFFLINE MOCK DATABASE ---
  return new Promise((resolve) => {
    setTimeout(() => {
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body) : null;

      // /api/admin/events
      if (url.startsWith('/api/admin/events')) {
        let events = getDb('events', []);
        if (method === 'GET') resolve({ events });
        if (method === 'POST') {
          const newEv = { ...body, id: Date.now().toString() };
          events = [newEv, ...events];
          setDb('events', events);
          resolve(newEv);
        }
        if (method === 'PUT') {
          const id = url.split('/').pop();
          events = events.map(e => e.id === id ? { ...body, id } : e);
          setDb('events', events);
          resolve({ ...body, id });
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          events = events.filter(e => e.id !== id);
          setDb('events', events);
          resolve({ success: true });
        }
      }
      
      // /api/admin/activity-events
      else if (url.startsWith('/api/admin/activity-events')) {
        const parts = url.split('/');
        const activityKey = decodeURIComponent(parts[3] || '');
        const eventId = decodeURIComponent(parts[4] || '');
        let allActs = getDb('activity_events', {});
        let acts = allActs[activityKey] || [];
        
        if (method === 'GET') resolve({ events: acts });
        if (method === 'POST') {
          const newEv = { ...body, id: Date.now().toString() };
          allActs[activityKey] = [newEv, ...acts];
          setDb('activity_events', allActs);
          resolve(newEv);
        }
        if (method === 'DELETE') {
          allActs[activityKey] = acts.filter(e => e.id !== eventId);
          setDb('activity_events', allActs);
          resolve({ success: true });
        }
      }

      // /api/admin/core-team
      else if (url.startsWith('/api/admin/core-team')) {
        let team = getDb('core_team', []);
        if (method === 'GET') resolve({ members: team });
        if (method === 'POST') {
          const newMem = { ...body, id: Date.now().toString() };
          team = [...team, newMem];
          setDb('core_team', team);
          resolve(newMem);
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          team = team.filter(m => m.id !== id);
          setDb('core_team', team);
          resolve({ success: true });
        }
      }
      // /api/admin/membership-apps
      else if (url.startsWith('/api/admin/membership-apps')) {
        let apps = getDb('membership_apps', []);
        const id = url.split('/').pop();
        if (method === 'GET') resolve({ apps });
        if (method === 'PUT') {
          apps = apps.map(a => a.id === id ? { ...a, status: body.status, statusUpdatedAt: new Date().toISOString() } : a);
          setDb('membership_apps', apps);
          resolve(apps.find(a => a.id === id));
        }
        if (method === 'DELETE') {
          apps = apps.filter(a => a.id !== id);
          setDb('membership_apps', apps);
          resolve({ success: true });
        }
      }

      // /api/admin/coreteam-apps
      else if (url.startsWith('/api/admin/coreteam-apps')) {
        let apps = getDb('coreteam_apps', []);
        const id = url.split('/').pop();
        if (method === 'GET') resolve({ apps });
        if (method === 'PUT') {
          apps = apps.map(a => a.id === id ? { ...a, status: body.status, statusUpdatedAt: new Date().toISOString() } : a);
          setDb('coreteam_apps', apps);
          resolve(apps.find(a => a.id === id));
        }
        if (method === 'DELETE') {
          apps = apps.filter(a => a.id !== id);
          setDb('coreteam_apps', apps);
          resolve({ success: true });
        }
      }
    }, 300); // simulate slight network delay
  });
}

export const api = {
  events: {
    getAll: () => fetchWithAuth('/api/admin/events'),
    create: async (event) => {
      const result = await fetchWithAuth('/api/admin/events', { method: 'POST', body: JSON.stringify(event) });
      eventEmitter.emit(EVENTS.EVENT_CREATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Event created' });
      return result;
    },
    update: async (id, event) => {
      const result = await fetchWithAuth(`/api/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(event) });
      eventEmitter.emit(EVENTS.EVENT_UPDATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Event updated' });
      return result;
    },
    delete: async (id) => {
      await fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.EVENT_DELETED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Event deleted' });
    },
  },

  activityEvents: {
    getAll: (activityKey) => fetchWithAuth(`/api/admin/activity-events/${encodeURIComponent(activityKey)}`),
    create: async (activityKey, event) => {
      const result = await fetchWithAuth(`/api/admin/activity-events/${encodeURIComponent(activityKey)}`, { method: 'POST', body: JSON.stringify(event) });
      eventEmitter.emit(EVENTS.ACTIVITY_EVENT_CREATED, { activityKey, event: result });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Activity event added' });
      return result;
    },
    delete: async (activityKey, eventId) => {
      await fetchWithAuth(`/api/admin/activity-events/${encodeURIComponent(activityKey)}/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.ACTIVITY_EVENT_DELETED, { activityKey, eventId });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Activity event deleted' });
    },
  },

  coreTeam: {
    getAll: () => fetchWithAuth('/api/admin/core-team'),
    add: async (member) => {
      const result = await fetchWithAuth('/api/admin/core-team', { method: 'POST', body: JSON.stringify(member) });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_ADDED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Member added' });
      return result;
    },
    remove: async (id) => {
      await fetchWithAuth(`/api/admin/core-team/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_REMOVED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Member removed' });
    },
  },

  membershipApps: {
    getAll: () => fetchWithAuth('/api/admin/membership-apps'),
    updateStatus: async (id, status) => {
      const result = await fetchWithAuth(`/api/admin/membership-apps/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      eventEmitter.emit(EVENTS.MEMBERSHIP_APP_STATUS_CHANGED, { id, status });
      const labels = { accepted: 'Accepted', rejected: 'Rejected', blacklisted: 'Blacklisted', pending: 'Reset to pending' };
      eventEmitter.emit(EVENTS.NOTIFY, { type: status === 'accepted' ? 'success' : 'info', message: `Application ${labels[status] || status}` });
      return result;
    },
    delete: async (id) => {
      await fetchWithAuth(`/api/admin/membership-apps/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Application removed' });
    },
  },

  coreTeamApps: {
    getAll: () => fetchWithAuth('/api/admin/coreteam-apps'),
    updateStatus: async (id, status) => {
      const result = await fetchWithAuth(`/api/admin/coreteam-apps/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      eventEmitter.emit(EVENTS.CORETEAM_APP_STATUS_CHANGED, { id, status });
      const labels = { accepted: 'Accepted', rejected: 'Rejected', blacklisted: 'Blacklisted', pending: 'Reset to pending' };
      eventEmitter.emit(EVENTS.NOTIFY, { type: status === 'accepted' ? 'success' : 'info', message: `Application ${labels[status] || status}` });
      return result;
    },
    delete: async (id) => {
      await fetchWithAuth(`/api/admin/coreteam-apps/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Application removed' });
    },
  },
};

