const API_BASE = import.meta.env.VITE_API_BASE || '';
const V1_BASE = `${API_BASE}/api/v1`;

let clerkTokenGetter = null;

export function setClerkTokenGetter(fn) {
  clerkTokenGetter = fn;
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignore token fetch errors for public endpoints
    }
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${V1_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || data?.message || `HTTP error ${response.status}`
    );
    error.status = response.status;
    error.code = data?.error?.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url, options) => request(url, { method: 'GET', ...options }),
  post: (url, body, options) =>
    request(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (url, body, options) =>
    request(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (url, body, options) =>
    request(url, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (url, options) => request(url, { method: 'DELETE', ...options }),

  // Auth & Profile
  syncAuth: (userData) => api.post('/auth/sync', userData),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),

  // Applications
  getApplicationStatusSummary: () => api.get('/applications/status'),
  getUserApplications: () => api.get('/applications'),
  getApplicationDetails: (id) => api.get(`/applications/${id}`),
  submitApplication: (applicationType, payload) =>
    api.post('/applications', { applicationType, payload }),

  // Activities & Categories
  getActivityCategories: () => api.get('/activity-categories'),
  getActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/activities${query ? `?${query}` : ''}`);
  },
  getActivityById: (id) => api.get(`/activities/${id}`),

  // Events & Registration
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/events${query ? `?${query}` : ''}`);
  },
  getEventById: (id) => api.get(`/events/${id}`),
  registerForEvent: (eventId, details) => api.post(`/events/${eventId}/register`, details),
  getUserEventRegistrations: () => api.get('/events/user/registrations'),

  // Teams & Mentors
  getTeams: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/teams${query ? `?${query}` : ''}`);
  },
  createTeam: (data) => api.post('/teams', data),
  joinTeam: (teamId, message) => api.post(`/teams/${teamId}/join`, { message }),
  getMentors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/mentors${query ? `?${query}` : ''}`);
  },

  // Notifications
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/notifications${query ? `?${query}` : ''}`);
  },
  markNotificationRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/read-all'),
};

export default api;
