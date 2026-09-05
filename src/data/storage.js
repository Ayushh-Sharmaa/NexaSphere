// ── NexaSphere Client Data & Applications Storage Service ──
// Provides seamless local persistence with automatic backend API sync.

const API_BASE = (import.meta.env?.VITE_API_BASE || '').replace(/\/+$/, '');
const apiUrl = (path) => API_BASE ? `${API_BASE}${path}` : path;

const MEMBERSHIP_STORAGE_KEY = 'ns_membership_applications';
const CORE_TEAM_STORAGE_KEY = 'ns_core_team_applications';
const EVENTS_STORAGE_KEY = 'ns_custom_events';

// Initial dummy seed applications for realistic dashboard testing if none exist
const DEFAULT_MEMBERSHIPS = [
  {
    id: 'mem-101',
    fullName: 'Rohan Sharma',
    collegeEmail: 'rohan.sharma@glbajajgroup.org',
    whatsapp: '9876543210',
    year: '1st Year',
    branch: 'CSE',
    section: 'A',
    interests: ['Web Development', 'AI / ML', 'Competitive Programming'],
    goals: 'Learn full-stack development and participate in collegiate hackathons.',
    status: 'pending', // 'pending' | 'accepted' | 'rejected' | 'blacklisted'
    submittedAt: '2025-03-10T10:30:00.000Z',
  },
  {
    id: 'mem-102',
    fullName: 'Priya Verma',
    collegeEmail: 'priya.verma@glbajajgroup.org',
    whatsapp: '9123456780',
    year: '2nd Year',
    branch: 'IT',
    section: 'B',
    interests: ['UI/UX Design', 'Event Management', 'Cloud Computing'],
    goals: 'Contribute to design sprints and organize community workshops.',
    status: 'accepted',
    submittedAt: '2025-03-12T14:15:00.000Z',
  }
];

const DEFAULT_CORE_TEAM = [
  {
    id: 'core-201',
    fullName: 'Amit Kumar',
    collegeEmail: 'amit.kumar@glbajajgroup.org',
    whatsapp: '9812345678',
    year: '2nd Year',
    branch: 'CSE (AI & ML)',
    section: 'C',
    role: 'Technical Lead',
    domain: 'Technical',
    skills: 'React, Node.js, Python, Docker, Git',
    comms: '9/10',
    campusExp: 'Yes',
    campusExpDetails: 'Led college robotics club workshop.',
    links: 'https://github.com/amitkumar-dev, https://linkedin.com/in/amitkumar',
    commitHours: '10-15 hrs/week',
    attendCampus: 'Yes',
    assessmentOk: 'Yes',
    whyJoin: 'I want to build real-world software products with NexaSphere and mentor junior students in web development.',
    status: 'pending',
    submittedAt: '2025-03-11T16:20:00.000Z',
  },
  {
    id: 'core-202',
    fullName: 'Sneha Patel',
    collegeEmail: 'sneha.patel@glbajajgroup.org',
    whatsapp: '9845678901',
    year: '1st Year',
    branch: 'CS',
    section: 'E',
    role: 'Design & Media Lead',
    domain: 'Media & Design',
    skills: 'Figma, Adobe Photoshop, After Effects, Canva',
    comms: '8/10',
    campusExp: 'Yes',
    campusExpDetails: 'Created posters for department tech fest.',
    links: 'https://behance.net/snehapatel',
    commitHours: '10-15 hrs/week',
    attendCampus: 'Yes',
    assessmentOk: 'Yes',
    whyJoin: 'Passionate about shaping the visual branding and social identity of NexaSphere across campus.',
    status: 'accepted',
    submittedAt: '2025-03-13T09:40:00.000Z',
  }
];

/* ── Membership Application Helpers ── */
export function getMembershipApplications() {
  try {
    const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERSHIPS));
      return DEFAULT_MEMBERSHIPS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MEMBERSHIPS;
  }
}

export function saveMembershipApplication(data) {
  const apps = getMembershipApplications();
  const newApp = {
    id: `mem-${Date.now()}`,
    fullName: data.fullName || '',
    collegeEmail: data.collegeEmail || '',
    whatsapp: data.whatsapp || '',
    year: data.year || '',
    branch: data.branch || '',
    section: data.section || '',
    interests: Array.isArray(data.interests) ? data.interests : [data.interests].filter(Boolean),
    goals: data.goals || '',
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  apps.unshift(newApp);
  try {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
  // Also try submitting to backend API if reachable
  fetch(apiUrl('/api/membership'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newApp),
  }).catch(() => {});
  return newApp;
}

export function updateMembershipStatus(id, newStatus) {
  const apps = getMembershipApplications();
  const updated = apps.map(app => app.id === id ? { ...app, status: newStatus } : app);
  try {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

export function deleteMembershipApplication(id) {
  const apps = getMembershipApplications();
  const updated = apps.filter(app => app.id !== id);
  try {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

/* ── Core Team Application Helpers ── */
export function getCoreTeamApplications() {
  try {
    const raw = localStorage.getItem(CORE_TEAM_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CORE_TEAM_STORAGE_KEY, JSON.stringify(DEFAULT_CORE_TEAM));
      return DEFAULT_CORE_TEAM;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CORE_TEAM;
  }
}

export function saveCoreTeamApplication(data) {
  const apps = getCoreTeamApplications();
  const newApp = {
    id: `core-${Date.now()}`,
    fullName: data.fullName || '',
    collegeEmail: data.collegeEmail || '',
    whatsapp: data.whatsapp || '',
    year: data.year || '',
    branch: data.branch || '',
    section: data.section || '',
    role: data.role || '',
    domain: data.domain || data.role || 'General',
    interests: Array.isArray(data.interests) ? data.interests : [data.interests].filter(Boolean),
    skills: data.skills || '',
    comms: data.comms || '',
    campusExp: data.campusExp || '',
    campusExpDetails: data.campusExpDetails || '',
    links: data.links || '',
    commitHours: data.commitHours || '',
    attendCampus: data.attendCampus || '',
    assessmentOk: data.assessmentOk || '',
    whyJoin: data.whyJoin || '',
    declaration: data.declaration || 'Accepted',
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  apps.unshift(newApp);
  try {
    localStorage.setItem(CORE_TEAM_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
  // Try sending to backend API
  fetch(apiUrl('/api/core-team/apply'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newApp),
  }).catch(() => {});
  return newApp;
}

export function updateCoreTeamStatus(id, newStatus) {
  const apps = getCoreTeamApplications();
  const updated = apps.map(app => app.id === id ? { ...app, status: newStatus } : app);
  try {
    localStorage.setItem(CORE_TEAM_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

export function deleteCoreTeamApplication(id) {
  const apps = getCoreTeamApplications();
  const updated = apps.filter(app => app.id !== id);
  try {
    localStorage.setItem(CORE_TEAM_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

/* ── Custom Events Storage Helpers ── */
export function getStoredCustomEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomEvent(eventData) {
  const events = getStoredCustomEvents();
  const existingIndex = events.findIndex(e => e.id === eventData.id);
  const formatted = {
    ...eventData,
    id: eventData.id || `ev-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  if (existingIndex >= 0) {
    events[existingIndex] = formatted;
  } else {
    formatted.createdAt = new Date().toISOString();
    events.unshift(formatted);
  }
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn(e);
  }
  return events;
}

export function deleteStoredCustomEvent(id) {
  const events = getStoredCustomEvents();
  const updated = events.filter(e => e.id !== id);
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}
