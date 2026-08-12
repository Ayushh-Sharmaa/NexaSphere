/**
 * admin-dashboard/src/services/api.js
 *
 * DATA SOURCE ARCHITECTURE — two-tier read model
 * ─────────────────────────────────────────────────────────────────────
 * OFFLINE MODE  (VITE_API_BASE is empty)
 *   Both admin dashboard and frontend read/write from browser localStorage
 *   under the keys:  ns_db_events, ns_db_core_team, ns_db_membership
 *   Changes in admin dashboard are immediately visible on the same device.
 *
 * ONLINE MODE  (VITE_API_BASE is set to the backend URL)
 *   Admin dashboard:  calls /api/admin/* endpoints (authenticated)
 *   Frontend:         calls /api/content/* endpoints (public read-only)
 *   localStorage is ONLY used as a fallback if the API is unreachable.
 *
 * MEMBERSHIP RESPONSES
 *   Read from VITE_MEMBERSHIP_SCRIPT_URL (Google Apps Script) in the admin.
 *   The frontend writes to the same GAS endpoint via POST.
 *   If VITE_MEMBERSHIP_SCRIPT_URL is empty the admin shows an offline banner.
 * ─────────────────────────────────────────────────────────────────────
 */
import { eventEmitter, EVENTS } from './eventEmitter';
import { auth } from './auth';
import { broadcastContentUpdate, initAdminSocket } from './socketClient';

// Team images are served from the main app's public dir.
// Using URL strings avoids broken asset imports in the admin monorepo build.
const MAIN_APP = import.meta.env.VITE_MAIN_APP_URL || 'https://nexasphere-glbajaj.vercel.app';
const teamImg = (name) => `${MAIN_APP}/assets/${name}`;

// Initialize socket connection on module load (gracefully fails if server is down)
initAdminSocket();

const ayushImg = teamImg('ayush.png');
const tanishkImg = teamImg('tanishk.png');
const tusharImg = teamImg('tushar.png');
const swayamImg = teamImg('swayam.png');
const aryanImg = teamImg('aryan.png');
const vartikaImg = teamImg('vartika.png');
const ankitImg = teamImg('ankit.png');
const surjeetImg = teamImg('surjeet.png');
const asthaImg = teamImg('astha.png');
const aryaImg = teamImg('arya.png');
const roshniImg = teamImg('roshni.png');
const vikasImg = teamImg('vikas.png');

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const safeJsonParse = (str, defaultVal) => {
  try {
    return str ? JSON.parse(str) : defaultVal;
  } catch {
    return defaultVal;
  }
};

// Migration: upgrade pre-v2 localStorage seed to the full 12-member official team.
// Uses a version key so migrations are idempotent — they run exactly once per browser.
// If the schema version is already >= 2, skip entirely to avoid touching real data.
const SCHEMA_VERSION = 2;
try {
  const currentVersion = parseInt(localStorage.getItem('ns_db_schema_version') || '0', 10);
  if (currentVersion < SCHEMA_VERSION) {
    const oldTeamRaw = localStorage.getItem('ns_db_core_team');
    if (oldTeamRaw) {
      const oldTeam = JSON.parse(oldTeamRaw);
      const hasFakePhotos =
        oldTeam.length > 0 &&
        typeof oldTeam[0].photo === 'string' &&
        oldTeam[0].photo.startsWith('http://via.placeholder');
      if (oldTeam.length === 3 && hasFakePhotos) {
        localStorage.removeItem('ns_db_core_team');
        localStorage.removeItem('ns_db_events');
      }
    }
    localStorage.setItem('ns_db_schema_version', String(SCHEMA_VERSION));
  }
} catch (e) {
  if (import.meta.env.DEV) console.error('Migration failed', e);
}

// Mock DB helpers with default seeding
const getDb = (key, defaultVal) => {
  try {
    const data = localStorage.getItem(`ns_db_${key}`);
    if (data) return JSON.parse(data);

    // Seed initial data if empty
    if (key === 'events') {
      const initialEvents = [
        {
          id: '1',
          name: 'KSS #153 — Knowledge Sharing Session',
          shortName: 'KSS #153',
          date: 'March 14, 2025',
          description: "NexaSphere's inaugural Knowledge Sharing Session.",
          status: 'completed',
          icon: 'Brain',
          tags: ['AI', 'Learning'],
          category: 'kss',
          location: 'Conference Hall',
          capacity: 50,
          hasDetailPage: true,
          gradientColors: ['#6b21a8', '#7c3aed', '#a855f7'],
        },
        {
          id: '2',
          name: 'Workshop: Git & GitHub',
          shortName: 'Git & GitHub',
          date: 'April 24',
          description: 'Version control mastery for every developer.',
          status: 'upcoming',
          icon: 'Wrench',
          tags: ['Git', 'GitHub'],
          category: 'workshop',
          location: 'Computer Lab',
          capacity: 30,
          hasDetailPage: true,
          gradientColors: ['#0369a1', '#0ea5e9'],
        },
      ];
      setDb(key, initialEvents);
      return initialEvents;
    }
    if (key === 'core_team') {
      const initialTeam = [
        {
          id: '1',
          name: 'Ayush Sharma',
          role: 'Organiser',
          branch: 'CSE (AI & ML)',
          photo: ayushImg,
        },
        {
          id: '2',
          name: 'Tanishk Bansal',
          role: 'Organiser',
          branch: 'CSE',
          photo: tanishkImg,
        },
        {
          id: '4',
          name: 'Tushar Goswami',
          role: 'Core Team Member',
          branch: 'CSE (AI & ML)',
          photo: tusharImg,
        },
        {
          id: '3',
          name: 'Swayam Dwivedi',
          role: 'Core Team Member',
          branch: 'CSE',
          photo: swayamImg,
        },
        {
          id: '5',
          name: 'Aryan Singh',
          role: 'Core Team Member',
          branch: 'CS (AI & ML)',
          photo: aryanImg,
        },
        {
          id: '11',
          name: 'Vartika Sharma',
          role: 'Core Team Member',
          branch: 'CS',
          photo: vartikaImg,
        },
        {
          id: '6',
          name: 'Arya Kaushik',
          role: 'Core Team Member',
          branch: 'CS (AI & ML)',
          photo: aryaImg,
        },
        {
          id: '7',
          name: 'Astha Shukla',
          role: 'Core Team Member',
          branch: 'CS (AI & ML)',
          photo: asthaImg,
        },
        {
          id: '8',
          name: 'Ankit Singh',
          role: 'Core Team Member',
          branch: 'CS',
          photo: ankitImg,
        },
        {
          id: '9',
          name: 'Vikas Kumar Sharma',
          role: 'Core Team Member',
          branch: 'CSE',
          photo: vikasImg,
        },
        {
          id: '10',
          name: 'Suryjeet Singh',
          role: 'Core Team Member',
          branch: 'CS',
          photo: surjeetImg,
        },
        {
          id: '12',
          name: 'Roshni Gupta',
          role: 'Core Team Member',
          branch: 'CST',
          photo: roshniImg,
        },
      ];
      setDb(key, initialTeam);
      return initialTeam;
    }
    if (key === 'resources') {
      const initialResources = [
        {
          id: '1',
          title: 'Introduction to Data Structures & Algorithms',
          description:
            'A comprehensive guide covering arrays, linked lists, trees, graphs, and sorting algorithms.',
          fileUrl: '#',
          fileType: 'application/pdf',
          fileSize: 2500000,
          category: 'study_material',
          tags: ['DSA', 'Python', 'Algorithms'],
          difficultyLevel: 'beginner',
          uploadedBy: 'Ayush Sharma',
          downloads: 342,
          votes: ['user1', 'user2'],
          status: 'approved',
          createdAt: '2026-06-01T10:00:00.000Z',
        },
        {
          id: '2',
          title: 'Web Dev MERN Template',
          description: 'Ready-to-use MERN stack project template with auth and CRUD.',
          fileUrl: '#',
          fileType: 'application/zip',
          fileSize: 8500000,
          category: 'project_template',
          tags: ['MERN', 'React', 'Node.js'],
          difficultyLevel: 'intermediate',
          uploadedBy: 'Tanishk Bansal',
          downloads: 189,
          votes: ['user3'],
          status: 'pending',
          createdAt: '2026-06-05T08:00:00.000Z',
        },
      ];
      setDb(key, initialResources);
      return initialResources;
    }
    if (key === 'announcements') {
      const initialAnnouncements = [
        {
          id: '1',
          title: 'Welcome to the NexaSphere Admin Dashboard',
          content:
            'Manage events, team members, announcements, and certificates with real-time updates.',
          category: 'general',
          pinned: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Upcoming Hackathon Registration Open',
          content:
            'Registration for the national hackathon closes in 3 days. Push notifications are active.',
          category: 'event',
          pinned: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setDb(key, initialAnnouncements);
      return initialAnnouncements;
    }
    if (key === 'sponsors') {
      const initialSponsors = [
        {
          id: '1',
          companyName: 'TechCorp India',
          logoUrl: '',
          description: 'Leading technology solutions provider supporting innovation in education.',
          websiteUrl: 'https://example.com/techcorp',
          contactPerson: 'Rahul Sharma',
          contactEmail: 'rahul@techcorp.com',
          tier: 'platinum',
          agreementStart: '2026-01-01',
          agreementEnd: '2026-12-31',
          amount: 500000,
          benefits: ['Logo on homepage', 'Event co-branding', 'Speaking slot', 'Premium placement'],
          status: 'active',
          isFeatured: true,
          sortOrder: 1,
          createdAt: '2026-06-01T10:00:00.000Z',
        },
        {
          id: '2',
          companyName: 'DevSolve Labs',
          logoUrl: '',
          description: 'Software development consultancy fostering campus tech communities.',
          websiteUrl: 'https://example.com/devsolve',
          contactPerson: 'Priya Patel',
          contactEmail: 'priya@devsolve.com',
          tier: 'gold',
          agreementStart: '2026-03-01',
          agreementEnd: '2026-08-31',
          amount: 250000,
          benefits: ['Logo on events', 'Newsletter mention', 'Booth at events'],
          status: 'active',
          isFeatured: false,
          sortOrder: 2,
          createdAt: '2026-06-05T08:00:00.000Z',
        },
      ];
      setDb(key, initialSponsors);
      return initialSponsors;
    }

    return defaultVal;
  } catch {
    return defaultVal;
  }
};
const setDb = (key, val) => localStorage.setItem(`ns_db_${key}`, JSON.stringify(val));

/**
 * Notify other origins (website on a different port) of content changes.
 * Dispatches a same-origin custom event AND posts a message to the
 * sync-bridge iframe so the website can pick up the change.
 */
function notifyContentUpdated(key) {
  window.dispatchEvent(new Event('ns-content-updated'));
  // Post to the sync-bridge iframe embedded by the website
  const bridge = document.querySelector('iframe[title="NexaSphere Sync Bridge"]');
  if (bridge?.contentWindow) {
    bridge.contentWindow.postMessage({ type: 'ns-sync', key }, window.location.origin);
  }
}

let isLoggingOut = false;

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)ns_csrf_token=([^;]*)/);
  return match ? match[1] : '';
}

function shouldIncludeCsrf(method) {
  return method && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export async function fetchWithAuth(url, options = {}) {
  const isOffline = auth.isOfflineMode();

  if (!isOffline) {
    // --- ONLINE: real API call ---
    try {
      const method = (options.method || 'GET').toUpperCase();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (shouldIncludeCsrf(method)) {
        headers['X-CSRF-Token'] = getCsrfToken();
      }
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        credentials: 'include',
        headers,
      });

      if (res.status === 401) {
        if (!isLoggingOut) {
          isLoggingOut = true;
          eventEmitter.emit(EVENTS.AUTH_TOKEN_EXPIRED);
          setTimeout(() => {
            isLoggingOut = false;
          }, 3000);
        }
        throw new Error('Session expired');
      }
      if (res.status === 204) return null;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      return res.json();
    } catch (e) {
      throw e;
    }
  }

  // --- OFFLINE MOCK DATABASE ---
  return new Promise((resolve) => {
    setTimeout(() => {
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body) : null;

      // Pagination helper for offline mock
      const getPageParams = () => {
        const qs = url.split('?')[1] || '';
        const params = new URLSearchParams(qs);
        return {
          page: parseInt(params.get('page'), 10) || 1,
          limit: parseInt(params.get('limit'), 10) || 25,
        };
      };
      const paginate = (arr) => {
        const { page, limit } = getPageParams();
        const total = arr.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
          rows: arr.slice(start, end),
          total,
          page,
          limit,
        };
      };

      // ── Event sub-paths (must come before generic /api/admin/events) ──

      // /api/admin/events/:eventId/registrations
      if (url.match(/\/api\/admin\/events\/[^\/]+\/registrations$/)) {
        const eventId = url.split('/')[4];
        let regDb = getDb('event_registrations', {});
        let regs = regDb[eventId] || [];
        if (method === 'GET') {
          const { rows, total } = paginate(regs);
          resolve({ registrations: rows, total });
        }
        if (method === 'POST') {
          const newReg = {
            ...body,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
          };
          regs = [newReg, ...regs];
          regDb[eventId] = regs;
          setDb('event_registrations', regDb);
          resolve(newReg);
        }
        return;
      }

      // /api/admin/events/:eventId/attendance
      if (url.match(/\/api\/admin\/events\/[^\/]+\/attendance$/)) {
        const eventId = url.split('/')[4];
        let regDb = getDb('event_registrations', {});
        let regs = regDb[eventId] || [];
        if (method === 'POST' && body) {
          const idx = regs.findIndex(
            (r) => r.email === body.email || r.ticket_token === body.token
          );
          if (idx >= 0) {
            regs[idx] = { ...regs[idx], attended: true, attended_at: new Date().toISOString() };
            regDb[eventId] = regs;
            setDb('event_registrations', regDb);
            resolve({ ...regs[idx], already_attended: false });
          } else {
            resolve({ error: 'Registration not found' });
          }
        }
        return;
      }

      // /api/admin/events/:eventId/analytics
      if (url.match(/\/api\/admin\/events\/[^\/]+\/analytics$/)) {
        const eventId = url.split('/')[4];
        let regDb = getDb('event_registrations', {});
        let regs = regDb[eventId] || [];
        const total = regs.length;
        const confirmed = regs.filter((r) => r.status === 'confirmed').length;
        const attended = regs.filter((r) => r.attended).length;
        resolve({
          eventId,
          stats: { total, confirmed, waitlisted: total - confirmed, attended },
          attendanceRate: confirmed > 0 ? Math.round((attended / confirmed) * 100) : 0,
          departmentBreakdown: [],
          yearBreakdown: [],
          waitlist: [],
        });
        return;
      }

      // /api/admin/events/recommendations
      if (url === '/api/admin/events/recommendations') {
        const events = getDb('events', []);
        const completedEvents = events.filter((event) => event.status === 'completed');
        const eventCount = completedEvents.length || events.length;
        const topEvent = events[0];

        resolve({
          generatedAt: new Date().toISOString(),
          dataWindow: {
            totalEvents: events.length,
            historicalEvents: eventCount,
            note: 'Offline recommendations use local admin event data only.',
          },
          recommendations: topEvent
            ? [
                {
                  title: `${topEvent.category || 'general'} events need early planning`,
                  priority: 'medium',
                  action: `Use ${topEvent.name} as the reference event and plan capacity around ${
                    topEvent.capacity || 30
                  }.`,
                  explanation:
                    'Offline mode cannot access live registration history, so this uses saved event metadata.',
                },
              ]
            : [],
          historicalPatterns: {
            sampleSize: eventCount,
            eventTypes: [],
            bestDay: null,
            seasonal: [],
            demographics: [],
          },
          planningRecommendations: [],
          attendancePredictions: [],
          schedulingRecommendations: {
            conflicts: [],
            recommendations: [
              'Connect to the server to analyze registration timing and conflicts.',
            ],
          },
          resourceRecommendations: [],
          topicRecommendations: {
            trending: [],
            gaps: [],
            partnerPreferences: [],
          },
        });
        return;
      }

      // /api/admin/events (base CRUD — must come after sub-path handlers)
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
          events = events.map((e) => (e.id === id ? { ...body, id } : e));
          setDb('events', events);
          resolve({ ...body, id });
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          events = events.filter((e) => e.id !== id);
          setDb('events', events);
          resolve({ success: true });
        }
      }

      // /api/admin/submissions/recruitment
      else if (url.startsWith('/api/admin/submissions/recruitment')) {
        const seedRecruitments = [
          {
            id: '1',
            fullName: 'Priya Sharma',
            collegeEmail: 'priya@glbajaj.org',
            year: '2nd',
            branch: 'CSE',
            role: 'Web Developer',
            interests: 'React, Node.js',
            status: 'applied',
            submittedAt: '2026-05-20T10:30:00Z',
          },
          {
            id: '2',
            fullName: 'Arjun Singh',
            collegeEmail: 'arjun@glbajaj.org',
            year: '3rd',
            branch: 'CSE (AI&ML)',
            role: 'AI Engineer',
            interests: 'Python, TensorFlow',
            status: 'shortlisted',
            submittedAt: '2026-05-19T14:00:00Z',
          },
          {
            id: '3',
            fullName: 'Neha Gupta',
            collegeEmail: 'neha@glbajaj.org',
            year: '1st',
            branch: 'IT',
            role: 'UI/UX Designer',
            interests: 'Figma, Design Systems',
            status: 'applied',
            submittedAt: '2026-05-18T09:15:00Z',
          },
          {
            id: '4',
            fullName: 'Rahul Verma',
            collegeEmail: 'rahul@glbajaj.org',
            year: '2nd',
            branch: 'ECE',
            role: 'Backend Developer',
            interests: 'Java, Spring Boot',
            status: 'rejected',
            submittedAt: '2026-05-17T16:45:00Z',
          },
          {
            id: '5',
            fullName: 'Sneha Patel',
            collegeEmail: 'sneha@glbajaj.org',
            year: '3rd',
            branch: 'CSE',
            role: 'DevOps Engineer',
            interests: 'Docker, Kubernetes',
            status: 'applied',
            submittedAt: '2026-05-16T11:20:00Z',
          },
        ];
        if (method === 'GET') {
          const { rows, total } = paginate(seedRecruitments);
          resolve({ submissions: rows, total });
        }
      }

      // /api/admin/membership
      else if (url.startsWith('/api/admin/membership')) {
        const seedMembership = Array.from({ length: 53 }, (_, i) => ({
          id: `mem-${i + 1}`,
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          fullName: `Student ${i + 1}`,
          collegeEmail: `student${i + 1}@glbajaj.org`,
          rollNumber: `${21000 + i}`,
          course: 'B.Tech',
          branch: ['CSE', 'CSE (AI&ML)', 'IT', 'ECE', 'ME'][i % 5],
          groupsSelected: ['Web, AI', 'AI, ML', 'Web', 'Cloud, DevOps', 'UI/UX'][i % 5],
          submittedAt: new Date(Date.now() - i * 86400000).toISOString(),
        }));
        if (method === 'GET') {
          const { rows, total } = paginate(seedMembership);
          resolve({ responses: rows, total });
        }
      }

      // /api/admin/certificates
      else if (url.startsWith('/api/admin/certificates')) {
        // Template operations
        if (url.includes('/templates')) {
          let templates = getDb('cert_templates', []);
          if (method === 'GET') resolve({ templates });
          if (method === 'POST') {
            const t = { ...body, id: Date.now().toString() };
            templates = [...templates, t];
            setDb('cert_templates', templates);
            resolve(t);
          }
          if (method === 'PUT') {
            const id = url.split('/').pop();
            templates = templates.map((t) => (t.id === id ? { ...body, id } : t));
            setDb('cert_templates', templates);
            resolve({ ...body, id });
          }
          if (method === 'DELETE') {
            const id = url.split('/').pop();
            templates = templates.filter((t) => t.id !== id);
            setDb('cert_templates', templates);
            resolve({ success: true });
          }
          return;
        }
        // Participant operations
        if (url.includes('/participants')) {
          resolve({ participants: [] });
          return;
        }
        // Certificate generation
        if (url.includes('/generate')) {
          resolve({ generated: 0, skipped: 0, certificates: [] });
          return;
        }
        // Revoke by ID
        if (url.match(/\/api\/admin\/certificates\/[^\/]+\/revoke$/)) {
          resolve({ success: true });
          return;
        }
        // GET /api/admin/certificates (issued logs)
        const seedCerts = Array.from({ length: 47 }, (_, i) => ({
          certificateId: `NS-CERT-${String(100000 + i).slice(0, 6)}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 1) % 26))}`,
          studentName: `Student ${i + 1}`,
          studentEmail: `student${i + 1}@glbajaj.org`,
          studentRollNumber: `${21000 + i}`,
          eventName: ['KSS #153', 'Git Workshop', 'AI Summit', 'Hackathon 2026', 'Webinar: Cloud'][
            i % 5
          ],
          issuedAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
          revoked: i > 40,
        }));
        if (method === 'GET') {
          const { rows, total } = paginate(seedCerts);
          resolve({ certificates: rows, total });
        }
      }

      // /api/admin/activity-events
      else if (url.startsWith('/api/admin/activity-events')) {
        const parts = url.split('/');
        const activityKey = parts[3];
        const eventId = parts[4];
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
          allActs[activityKey] = acts.filter((e) => e.id !== eventId);
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
        if (method === 'PUT') {
          const id = url.split('/').pop();
          team = team.map((m) => (m.id === id ? { ...body, id } : m));
          setDb('core_team', team);
          resolve({ ...body, id });
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          team = team.filter((m) => m.id !== id);
          setDb('core_team', team);
          resolve({ success: true });
        }
      }

      // /api/admin/portfolios
      else if (url.startsWith('/api/admin/portfolios')) {
        let portfolios = getDb('portfolios', []);
        if (method === 'GET') {
          const queryParams = new URLSearchParams(url.split('?')[1] || '');
          const username = queryParams.get('username');
          if (username) {
            const found = portfolios.find((p) => p.username === username);
            resolve({ portfolios: found ? [found] : [] });
          } else {
            resolve({ portfolios });
          }
        }
        if (method === 'DELETE' && url.includes('/achievements/')) {
          resolve({ ok: true });
        }
        if (method === 'POST' && url.includes('/achievements')) {
          const newAch = {
            ...body,
            id: Date.now().toString(),
            awarded_at: new Date().toISOString(),
          };
          resolve({ achievement: newAch });
        }
      }

      // /api/admin/events/:id/waiting-room
      else if (url.match(/\/api\/admin\/events\/[^\/]+\/waiting-room/)) {
        const eventId = url.split('/')[4];
        const action = url.split('/')[6];
        let queue = getDb(`waiting_${eventId}`, [
          {
            id: 'wr_mock_1',
            fullName: 'Anjali Sharma',
            email: 'anjali@example.com',
            isPriority: false,
            joinedAt: new Date(Date.now() - 120000).toISOString(),
          },
          {
            id: 'wr_mock_2',
            fullName: 'Rahul Verma',
            email: 'rahul@example.com',
            isPriority: false,
            joinedAt: new Date(Date.now() - 90000).toISOString(),
          },
          {
            id: 'wr_mock_3',
            fullName: 'Priya Kapoor',
            email: 'priya@example.com',
            isPriority: true,
            joinedAt: new Date(Date.now() - 60000).toISOString(),
          },
        ]);
        if (method === 'GET') resolve({ queue, total: queue.length });
        if (method === 'POST' && !action) {
          const newEntry = { ...body, id: `wr_${Date.now()}`, joinedAt: new Date().toISOString() };
          queue = [...queue, newEntry];
          setDb(`waiting_${eventId}`, queue);
          resolve(newEntry);
        }
        if (method === 'POST' && action === 'admit-one') {
          const [admitted, ...rest] = queue;
          setDb(`waiting_${eventId}`, rest);
          resolve({ admitted });
        }
        if (method === 'POST' && action === 'admit-all') {
          const count = queue.length;
          setDb(`waiting_${eventId}`, []);
          resolve({ count, admitted: true });
        }
        if (method === 'POST' && action === 'move-front') {
          const entryId = url.split('/')[5];
          const idx = queue.findIndex((e) => e.id === entryId);
          if (idx >= 0) {
            const [entry] = queue.splice(idx, 1);
            queue.unshift({ ...entry, isPriority: true });
            setDb(`waiting_${eventId}`, queue);
          }
          resolve({ ok: true });
        }
        if (method === 'POST' && action === 'message') {
          resolve({ ok: true });
        }
        if (method === 'DELETE') {
          const entryId = url.split('/')[5];
          queue = queue.filter((e) => e.id !== entryId);
          setDb(`waiting_${eventId}`, queue);
          resolve({ ok: true });
        }
      }

      // /api/admin/announcements
      else if (url.startsWith('/api/admin/announcements')) {
        let announcements = getDb('announcements', []);
        if (method === 'GET') resolve({ announcements });
        if (method === 'POST') {
          const newAnn = {
            ...body,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };
          announcements = [newAnn, ...announcements];
          setDb('announcements', announcements);
          resolve(newAnn);
        }
        if (method === 'PUT') {
          const id = url.split('/').pop();
          announcements = announcements.map((a) =>
            a.id === id ? { ...body, id, updatedAt: new Date().toISOString() } : a
          );
          setDb('announcements', announcements);
          resolve({ ...body, id });
        }
        if (method === 'DELETE') {
          const id = url.split('/').pop();
          announcements = announcements.filter((a) => a.id !== id);
          setDb('announcements', announcements);
          resolve({ success: true });
        }
      }

      // /api/admin/events/:eventId/registrations
      else if (url.match(/\/api\/admin\/events\/[^\/]+\/registrations/)) {
        const eventId = url.split('/')[4];
        let regDb = getDb('event_registrations', {});
        let regs = regDb[eventId] || [];
        if (method === 'GET') resolve({ registrations: regs });
        if (method === 'POST') {
          const newReg = {
            ...body,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
          };
          regs = [newReg, ...regs];
          regDb[eventId] = regs;
          setDb('event_registrations', regDb);
          resolve(newReg);
        }
      }

      // /api/admin/events/:eventId/attendance
      else if (url.match(/\/api\/admin\/events\/[^\/]+\/attendance/)) {
        const eventId = url.split('/')[4];
        let regDb = getDb('event_registrations', {});
        let regs = regDb[eventId] || [];
        if (method === 'POST' && body) {
          const idx = regs.findIndex(
            (r) => r.email === body.email || r.ticket_token === body.token
          );
          if (idx >= 0) {
            regs[idx] = { ...regs[idx], attended: true, attended_at: new Date().toISOString() };
            regDb[eventId] = regs;
            setDb('event_registrations', regDb);
            resolve({ ...regs[idx], already_attended: false });
          } else {
            resolve({ error: 'Registration not found' });
          }
        }
      }

      // /api/admin/qa/:eventId/questions
      else if (url.match(/\/api\/admin\/qa\/[^\/]+\/questions/)) {
        const parts = url.split('/');
        const eventId = parts[4];
        let qaDb = getDb('qa_questions', {});
        let qs = qaDb[eventId] || [];

        if (method === 'GET') {
          const sortBy = new URL(url).searchParams.get('sortBy') || 'upvotes';
          const sorted = [...qs];
          if (sortBy === 'upvotes') sorted.sort((a, b) => b.upvotes - a.upvotes);
          else if (sortBy === 'recent') sorted.sort((a, b) => b.createdAt - a.createdAt);
          else if (sortBy === 'unanswered')
            sorted.sort((a, b) => (a.status === 'answered' ? 1 : -1));
          resolve({ questions: sorted });
        }
        if (method === 'PATCH' && parts[6] === 'moderate') {
          const qId = parts[5];
          const q = qs.find((q) => q.id === qId);
          if (q) {
            if (body.action === 'feature') q.isFeatured = true;
            else if (body.action === 'unfeature') q.isFeatured = false;
            else if (body.action === 'answered') q.status = 'answered';
            else if (body.action === 'duplicate') q.status = 'duplicate';
            else if (body.action === 'remove') {
              qs = qs.filter((qq) => qq.id !== qId);
            }
          }
          qaDb[eventId] = qs;
          setDb('qa_questions', qaDb);
          resolve({ success: true });
        }
        if (method === 'POST' && parts[6] === 'answer') {
          const qId = parts[5];
          const q = qs.find((q) => q.id === qId);
          if (q) {
            q.answer = body.answer;
            q.answeredBy = 'Speaker (Offline)';
            q.status = 'answered';
          }
          qaDb[eventId] = qs;
          setDb('qa_questions', qaDb);
          resolve({ success: true });
        }
        if (method === 'POST' && parts[6] === 'upvote') {
          const qId = parts[5];
          const q = qs.find((q) => q.id === qId);
          if (q) q.upvotes = (q.upvotes || 0) + 1;
          qaDb[eventId] = qs;
          setDb('qa_questions', qaDb);
          resolve({ success: true });
        }
      }

      // /api/admin/qa/:eventId/polls
      else if (url.match(/\/api\/admin\/qa\/[^\/]+\/polls/)) {
        const parts = url.split('/');
        const eventId = parts[4];
        let pollDb = getDb('qa_polls', {});
        let ps = pollDb[eventId] || [];

        if (method === 'GET') resolve({ polls: ps });
        if (method === 'POST' && !parts[6]) {
          const newPoll = {
            ...body,
            id: Date.now().toString(),
            options: body.options.map((opt, i) => ({
              id: `${Date.now()}-${i}`,
              text: opt,
              votes: 0,
              voters: [],
            })),
            totalVotes: 0,
            status: 'active',
            createdAt: Date.now(),
          };
          ps = [newPoll, ...ps];
          pollDb[eventId] = ps;
          setDb('qa_polls', pollDb);
          resolve(newPoll);
        }
        if (method === 'POST' && parts[6] && parts[7] === 'close') {
          const pollId = parts[6];
          const poll = ps.find((p) => p.id === pollId);
          if (poll) poll.status = 'closed';
          pollDb[eventId] = ps;
          setDb('qa_polls', pollDb);
          resolve({ success: true });
        }
      }

      // /api/admin/events/:eventId/analytics
      else if (url.match(/\/api\/admin\/events\/[^\/]+\/analytics/)) {
        const eventId = url.split('/')[4];
        let regDb = getDb('event_registrations', {});
        let regs = regDb[eventId] || [];
        const total = regs.length;
        const confirmed = regs.filter((r) => r.status === 'confirmed').length;
        const attended = regs.filter((r) => r.attended).length;
        resolve({
          eventId,
          stats: { total, confirmed, waitlisted: total - confirmed, attended },
          attendanceRate: confirmed > 0 ? Math.round((attended / confirmed) * 100) : 0,
          departmentBreakdown: [],
          yearBreakdown: [],
          waitlist: [],
        });
      }

      // /api/admin/reports/engagement
      else if (url.startsWith('/api/admin/reports/engagement')) {
        const seedUsers = Array.from({ length: 45 }, (_, i) => {
          const eventsAttended = Math.floor(Math.random() * 15);
          const portfolioCompletion = Math.floor(Math.random() * 101);
          const activeDays30 = Math.floor(Math.random() * 31);
          const activeDays90 = Math.floor(Math.random() * 91);
          const score30 = Math.min((activeDays30 / 30) * 40, 40);
          const scoreEvents = Math.min((eventsAttended / 10) * 30, 30);
          const scorePortfolio = (portfolioCompletion / 100) * 30;
          const engagementScore = Math.round(score30 + scoreEvents + scorePortfolio);
          const isInactive = activeDays30 < 2 && eventsAttended === 0;

          return {
            id: `user-${i + 1}`,
            name: `Community Member ${i + 1}`,
            eventsAttended,
            portfolioCompletion,
            activeDays30,
            activeDays90,
            engagementScore,
            status: isInactive ? 'Inactive' : 'Active',
          };
        });
        seedUsers.sort((a, b) => b.engagementScore - a.engagementScore);
        resolve({ users: seedUsers });
      }

      // /api/admin/reports/revenue
      else if (url.startsWith('/api/admin/reports/revenue')) {
        const today = new Date();
        const trend = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          const dailyRevs = [1200, 1800, 2400, 1500, 2100, 3100, 3300];
          return {
            date: dateStr,
            revenue: dailyRevs[i],
          };
        });

        resolve({
          stats: {
            totalRevenue: 15400,
            totalRefunded: 600,
            totalTax: 1240,
            netRevenue: 14800,
          },
          revenueByEvent: [
            { eventName: 'Web Dev Boot Camp 2026', revenue: 8000 },
            { eventName: 'AI Summit 2026', revenue: 5000 },
            { eventName: 'Workshop: Git & GitHub', revenue: 2400 },
            { eventName: 'KSS #153 — Knowledge Sharing Session', revenue: 0 },
          ],
          paymentMethodBreakdown: [
            { method: 'UPI', amount: 6200, percentage: 40 },
            { method: 'CARD', amount: 5400, percentage: 35 },
            { method: 'PAYPAL', amount: 3100, percentage: 20 },
            { method: 'CASH', amount: 700, percentage: 5 },
          ],
          refunds: [
            {
              id: 'ref_1',
              eventName: 'Web Dev Boot Camp 2026',
              source: 'Ticket Refund',
              amount: 200,
              refundAmount: 200,
              receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 'ref_2',
              eventName: 'AI Summit 2026',
              source: 'Ticket Refund',
              amount: 400,
              refundAmount: 400,
              receivedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            },
          ],
          revenueTrend: trend,
          taxSummary: {
            totalBeforeTax: 14160,
            totalTax: 1240,
            totalRevenue: 15400,
          },
        });
      }

      // /api/admin/backups/restore-test-history
      else if (url.startsWith('/api/admin/backups/restore-test-history')) {
        resolve({
          history: [
            {
              id: 'rest_test_1',
              verified_at: new Date(Date.now() - 86400000 * 15).toISOString(),
              backup_key: 'backup_full_2026-06-08.enc',
              restore_type: 'full',
              status: 'success',
              duration_ms: 1420,
            },
            {
              id: 'rest_test_2',
              verified_at: new Date(Date.now() - 86400000 * 45).toISOString(),
              backup_key: 'backup_full_2026-05-08.enc',
              restore_type: 'full',
              status: 'success',
              duration_ms: 1390,
            },
          ],
        });
      }

      // /api/admin/backups
      else if (url.startsWith('/api/admin/backups')) {
        if (method === 'GET') {
          resolve({
            stats: {
              totalSize: 45890000,
              totalCount: 3,
              storageType: 'AWS S3 Redundant Bucket (eu-west-1)',
              utilizationPercentage: 14,
            },
            backups: [
              {
                key: 'backup_full_2026-06-22.enc',
                filename: 'backup_full_2026-06-22.enc',
                type: 'full',
                size: 24500000,
                location: 's3',
                date: new Date(Date.now() - 86400000).toISOString(),
              },
              {
                key: 'backup_inc_2026-06-23.enc',
                filename: 'backup_inc_2026-06-23.enc',
                type: 'incremental',
                size: 1390000,
                location: 's3',
                date: new Date(Date.now() - 3600000 * 4).toISOString(),
              },
              {
                key: 'backup_full_2026-06-15.enc',
                filename: 'backup_full_2026-06-15.enc',
                type: 'full',
                size: 20000000,
                location: 's3',
                date: new Date(Date.now() - 86400000 * 8).toISOString(),
              },
            ],
          });
        } else if (method === 'POST' && url.includes('/manual')) {
          resolve({
            key: `backup_manual_${Date.now()}.enc`,
            filename: `backup_manual_${Date.now()}.enc`,
          });
        } else if (method === 'POST' && url.includes('/restore')) {
          resolve({ result: { durationMs: 480 } });
        } else if (method === 'DELETE') {
          resolve({ success: true });
        }
      }
    }, 300); // simulate slight network delay
  });
}

export const api = {
  projectHealth: {
    getOverview: () => fetchWithAuth('/api/admin/project-health'),
  },
  resources: {
    getAll: (params = '') => fetchWithAuth(`/api/admin/resources${params}`),
    update: async (id, data) => {
      const result = await fetchWithAuth(`/api/admin/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Resource updated' });
      return result;
    },
    delete: async (id) => {
      await fetchWithAuth(`/api/admin/resources/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Resource deleted' });
    },
    moderate: async (id, status) => {
      const result = await fetchWithAuth(`/api/admin/resources/${id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return result;
    },
  },
  mentorship: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      if (auth.isOfflineMode()) {
        return { mentorships: [], total: 0 };
      }
      return fetchWithAuth(`/api/admin/mentorships${query ? `?${query}` : ''}`);
    },
    getMentors: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      if (auth.isOfflineMode()) {
        return { mentors: [], total: 0 };
      }
      return fetchWithAuth(`/api/admin/mentors${query ? `?${query}` : ''}`);
    },
    updateStatus: async (id, status) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, { type: 'warning', message: 'Offline mode' });
        return;
      }
      const result = await fetchWithAuth(`/api/mentorship/requests/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: `Mentorship ${status}` });
      return result;
    },
  },
  eventRegistrations: {
    list: (eventId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/api/admin/events/${eventId}/registrations${query ? `?${query}` : ''}`);
    },
    markAttendance: (eventId, payload) =>
      fetchWithAuth(`/api/admin/events/${eventId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    analytics: (eventId) => fetchWithAuth(`/api/admin/events/${eventId}/analytics`),
  },
  events: {
    getAll: () => fetchWithAuth('/api/admin/events'),
    recommendations: () => fetchWithAuth('/api/admin/events/recommendations'),
    create: async (event) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
      eventEmitter.emit(EVENTS.EVENT_CREATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Event created',
      });
      broadcastContentUpdate('events');
      notifyContentUpdated('ns_db_events');
      return result;
    },
    update: async (id, event) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth(`/api/admin/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });
      eventEmitter.emit(EVENTS.EVENT_UPDATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Event updated',
      });
      broadcastContentUpdate('events');
      notifyContentUpdated('ns_db_events');
      return result;
    },
    delete: async (id) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      await fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' });
      // Record tombstone for offline sync to avoid resurrecting deleted events
      try {
        const tombstoneKey = 'ns_tombstone_events';
        const existing = safeJsonParse(localStorage.getItem(tombstoneKey), []);
        const updated = Array.isArray(existing) ? [...existing, id] : [id];
        localStorage.setItem(tombstoneKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to record tombstone for event deletion', e);
      }
      eventEmitter.emit(EVENTS.EVENT_DELETED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Event deleted',
      });
      broadcastContentUpdate('events');
      notifyContentUpdated('ns_db_events');
    },
  },

  activityEvents: {
    getAll: (activityKey) => fetchWithAuth(`/api/admin/activity-events/${activityKey}`),
    create: async (activityKey, event) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth(`/api/admin/activity-events/${activityKey}`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
      eventEmitter.emit(EVENTS.ACTIVITY_EVENT_CREATED, {
        activityKey,
        event: result,
      });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Activity event added',
      });
      broadcastContentUpdate('activities');
      notifyContentUpdated('ns_db_events');
    },
    delete: async (activityKey, eventId) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      await fetchWithAuth(`/api/admin/activity-events/${activityKey}/${eventId}`, {
        method: 'DELETE',
      });
      eventEmitter.emit(EVENTS.ACTIVITY_EVENT_DELETED, {
        activityKey,
        eventId,
      });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Activity event deleted',
      });
      broadcastContentUpdate('activities');
      notifyContentUpdated('ns_db_events');
    },
  },

  coreTeam: {
    getAll: async () => {
      const result = await fetchWithAuth('/api/admin/core-team');
      const members = result?.members ?? result ?? [];

      // If Java DB is empty, seed it with the official team data
      // (photos are bundled assets and can't live in Java, so we always merge)
      if (members.length === 0) {
        // Return the local seeded team so admin always sees the real team
        const seeded = getDb('core_team', []);
        return { members: seeded };
      }
      return { members };
    },
    add: async (member) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth('/api/admin/core-team', {
        method: 'POST',
        body: JSON.stringify(member),
      });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_ADDED, result);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Member added',
      });
      broadcastContentUpdate('team');
      notifyContentUpdated('ns_db_core_team');
    },
    update: async (id, member) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth(`/api/admin/core-team/${id}`, {
        method: 'PUT',
        body: JSON.stringify(member),
      });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_UPDATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Member updated',
      });
      broadcastContentUpdate('team');
      notifyContentUpdated('ns_db_core_team');
    },
    remove: async (id) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      await fetchWithAuth(`/api/admin/core-team/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.CORE_TEAM_MEMBER_REMOVED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Member removed',
      });
      broadcastContentUpdate('team');
      notifyContentUpdated('ns_db_core_team');
    },
  },

  membership: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/api/admin/membership${query ? `?${query}` : ''}`);
    },
  },

  recruitment: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/api/admin/submissions/recruitment${query ? `?${query}` : ''}`);
    },
    updateStatus: async (id, status) => {
      const result = await fetchWithAuth(`/api/admin/submissions/recruitment/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: `Application status updated to ${status}`,
      });
      return result;
    },
  },

  certificates: {
    getTemplates: () => fetchWithAuth('/api/admin/certificates/templates'),
    createTemplate: async (template) => {
      const result = await fetchWithAuth('/api/admin/certificates/templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Template saved' });
      return result;
    },
    updateTemplate: async (id, template) => {
      const result = await fetchWithAuth(`/api/admin/certificates/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(template),
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Template updated' });
      return result;
    },
    deleteTemplate: async (id) => {
      await fetchWithAuth(`/api/admin/certificates/templates/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Template deleted' });
    },
    getParticipants: (eventId) => fetchWithAuth(`/api/admin/certificates/participants/${eventId}`),
    addParticipant: async (eventId, participant) => {
      return fetchWithAuth(`/api/admin/certificates/participants/${eventId}`, {
        method: 'POST',
        body: JSON.stringify(participant),
      });
    },
    bulkAddParticipants: async (eventId, participants) => {
      return fetchWithAuth(`/api/admin/certificates/participants/${eventId}/bulk`, {
        method: 'POST',
        body: JSON.stringify(participants),
      });
    },
    generate: async (data) => {
      const result = await fetchWithAuth('/api/admin/certificates/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: `Generated ${result.generated} certificate(s)`,
      });
      return result;
    },
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/api/admin/certificates${query ? `?${query}` : ''}`);
    },
    revoke: async (id) => {
      const result = await fetchWithAuth(`/api/admin/certificates/${id}/revoke`, {
        method: 'PATCH',
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Certificate revoked' });
      return result;
    },
  },

  portfolios: {
    getAll: (params = '') => fetchWithAuth(`/api/admin/portfolios${params}`),
    getAchievements: (username) =>
      fetchWithAuth(`/api/admin/portfolios/${encodeURIComponent(username)}/achievements`),
    awardAchievement: (username, achievement) =>
      fetchWithAuth(`/api/admin/portfolios/${encodeURIComponent(username)}/achievements`, {
        method: 'POST',
        body: JSON.stringify(achievement),
      }),
    removeAchievement: (username, name) =>
      fetchWithAuth(
        `/api/admin/portfolios/${encodeURIComponent(username)}/achievements/${encodeURIComponent(name)}`,
        {
          method: 'DELETE',
        }
      ),
  },

  announcements: {
    getAll: () => fetchWithAuth('/api/admin/announcements'),
    create: async (announcement) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(announcement),
      });
      eventEmitter.emit(EVENTS.ANNOUNCEMENT_CREATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Announcement published',
      });
      broadcastContentUpdate('announcements');
      notifyContentUpdated('ns_db_announcements');
      return result;
    },
    update: async (id, announcement) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      const result = await fetchWithAuth(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(announcement),
      });
      eventEmitter.emit(EVENTS.ANNOUNCEMENT_UPDATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Announcement updated',
      });
      broadcastContentUpdate('announcements');
      notifyContentUpdated('ns_db_announcements');
      return result;
    },
    delete: async (id) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'warning',
          message: 'Offline — changes not saved to server',
        });
      }
      await fetchWithAuth(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.ANNOUNCEMENT_DELETED, { id });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Announcement deleted',
      });
      broadcastContentUpdate('announcements');
      notifyContentUpdated('ns_db_announcements');
    },
  },
  alerts: {
    getRules: () => fetchWithAuth('/api/admin/alerts/rules'),
    updateRule: (id, body) =>
      fetchWithAuth(`/api/admin/alerts/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    getEvents: () => fetchWithAuth('/api/admin/alerts/events'),
    updateEventStatus: (id, status) =>
      fetchWithAuth(`/api/admin/alerts/events/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
  },

  circuitBreaker: {
    getMetrics: () => fetchWithAuth('/api/admin/circuit-breaker/metrics'),
    reset: (name) =>
      fetchWithAuth(`/api/admin/circuit-breaker/reset/${encodeURIComponent(name)}`, {
        method: 'POST',
      }),
    retry: (name) =>
      fetchWithAuth(`/api/admin/circuit-breaker/retry/${encodeURIComponent(name)}`, {
        method: 'POST',
      }),
  },

  waitingRoom: {
    getQueue: (eventId) =>
      fetchWithAuth(`/api/admin/events/${encodeURIComponent(eventId)}/waiting-room`),
    admitOne: (eventId) =>
      fetchWithAuth(`/api/admin/events/${encodeURIComponent(eventId)}/waiting-room/admit-one`, {
        method: 'POST',
      }),
    admitAll: (eventId) =>
      fetchWithAuth(`/api/admin/events/${encodeURIComponent(eventId)}/waiting-room/admit-all`, {
        method: 'POST',
      }),
    remove: (eventId, entryId) =>
      fetchWithAuth(
        `/api/admin/events/${encodeURIComponent(eventId)}/waiting-room/${encodeURIComponent(entryId)}`,
        { method: 'DELETE' }
      ),
    moveToFront: (eventId, entryId) =>
      fetchWithAuth(
        `/api/admin/events/${encodeURIComponent(eventId)}/waiting-room/${encodeURIComponent(entryId)}/move-front`,
        { method: 'POST' }
      ),
    sendMessage: (eventId, message) =>
      fetchWithAuth(`/api/admin/events/${encodeURIComponent(eventId)}/waiting-room/message`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },

  impersonate: {
    start: (userId) => fetchWithAuth(`/api/admin/impersonate/start/${userId}`, { method: 'POST' }),
    stop: () => fetchWithAuth('/api/admin/impersonate/stop', { method: 'POST' }),
    status: () => fetchWithAuth('/api/admin/impersonate/status'),
  },
  forum: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      if (auth.isOfflineMode()) {
        return { threads: [], total: 0 };
      }
      return fetchWithAuth(`/api/admin/forum/threads${query ? `?${query}` : ''}`);
    },
    moderate: async (id, status) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, { type: 'warning', message: 'Offline mode' });
        return;
      }
      const result = await fetchWithAuth(`/api/admin/forum/threads/${id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: `Thread ${status}` });
      broadcastContentUpdate('forum');
      return result;
    },
    delete: async (id) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, { type: 'warning', message: 'Offline mode' });
        return;
      }
      await fetchWithAuth(`/api/forum/threads/${id}`, { method: 'DELETE' });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Thread deleted' });
      broadcastContentUpdate('forum');
    },
    moderateReply: async (id, status) => {
      if (auth.isOfflineMode()) {
        eventEmitter.emit(EVENTS.NOTIFY, { type: 'warning', message: 'Offline mode' });
        return;
      }
      const result = await fetchWithAuth(`/api/admin/forum/replies/${id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: `Reply ${status}` });
      return result;
    },
  },

  subscriptions: {
    getAll: async () => {
      if (auth.isOfflineMode()) {
        const subs = safeJsonParse(localStorage.getItem('ns_db_subscriptions'), []);
        return { subscriptions: subs };
      }
      return fetchWithAuth('/api/admin/subscriptions');
    },
    getStats: async () => {
      if (auth.isOfflineMode()) {
        const subs = safeJsonParse(localStorage.getItem('ns_db_subscriptions'), []);
        return {
          total: subs.length,
          premium: subs.filter((s) => s.tier === 'premium').length,
          pro: subs.filter((s) => s.tier === 'pro').length,
          revenue: subs.reduce((sum, s) => sum + (s.price || 0), 0),
        };
      }
      return fetchWithAuth('/api/admin/subscriptions/stats');
    },
    create: async (userId, tierId) => {
      const result = await fetchWithAuth('/api/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ userId, tierId }),
      });
      eventEmitter.emit(EVENTS.SUBSCRIPTION_CREATED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Subscription created' });
      return result;
    },
    cancel: async (userId) => {
      const result = await fetchWithAuth(`/api/admin/subscriptions/${userId}/cancel`, {
        method: 'POST',
      });
      eventEmitter.emit(EVENTS.SUBSCRIPTION_CANCELLED, result);
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'success', message: 'Subscription cancelled' });
      return result;
    },
    getBillingHistory: (userId) => fetchWithAuth(`/api/admin/subscriptions/${userId}/billing`),
  },

  reports: {
    getEngagement: () => fetchWithAuth('/api/admin/reports/engagement'),
    getRevenue: () => fetchWithAuth('/api/admin/reports/revenue'),
  },

  backups: {
    get: () => fetchWithAuth('/api/admin/backups'),
    getRestoreHistory: () => fetchWithAuth('/api/admin/backups/restore-test-history'),
    runManual: (type) =>
      fetchWithAuth('/api/admin/backups/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      }),
    restore: (backupKey) =>
      fetchWithAuth('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupKey }),
      }),
    restorePITR: (targetTime) =>
      fetchWithAuth('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTime }),
      }),
    delete: (key) =>
      fetchWithAuth(`/api/admin/backups/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  },

  moderation: {
    getFlags: (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/api/moderation/flags${query ? `?${query}` : ''}`);
    },
    getFlagById: (id) => fetchWithAuth(`/api/moderation/flags/${id}`),
    approveFlag: (id) => fetchWithAuth(`/api/moderation/flags/${id}/approve`, { method: 'PUT' }),
    rejectFlag: (id, reason) =>
      fetchWithAuth(`/api/moderation/flags/${id}/remove`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    warnUser: (userId) =>
      fetchWithAuth(`/api/moderation/users/${userId}/warn`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Violating community guidelines' }),
      }),
    banUser: (userId) =>
      fetchWithAuth(`/api/moderation/users/${userId}/warn`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Permanent ban for repeated violations' }),
      }),
    getAppeals: (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/api/moderation/appeals${query ? `?${query}` : ''}`);
    },
    approveAppeal: (id, note) =>
      fetchWithAuth(`/api/moderation/appeals/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ decision: 'overturned', decisionNote: note }),
      }),
    rejectAppeal: (id, note) =>
      fetchWithAuth(`/api/moderation/appeals/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ decision: 'upheld', decisionNote: note }),
      }),
    getStats: () => fetchWithAuth('/api/moderation/stats'),
  },

  rbac: {
    getRoles: () => fetchWithAuth('/api/admin/rbac/roles'),
    getPermissions: () => fetchWithAuth('/api/admin/rbac/permissions'),
    getPermissionMatrix: () => fetchWithAuth('/api/admin/rbac/matrix'),
    createRole: (roleData) =>
      fetchWithAuth('/api/admin/rbac/roles', {
        method: 'POST',
        body: JSON.stringify(roleData),
      }),
    updateRole: (roleName, roleData) =>
      fetchWithAuth(`/api/admin/rbac/roles/${roleName}`, {
        method: 'PUT',
        body: JSON.stringify(roleData),
      }),
    deleteRole: (roleName) =>
      fetchWithAuth(`/api/admin/rbac/roles/${roleName}`, {
        method: 'DELETE',
      }),
    getUsersWithRoles: () => fetchWithAuth('/api/admin/rbac/users'),
    assignRole: (assignment) =>
      fetchWithAuth('/api/admin/rbac/assign', {
        method: 'POST',
        body: JSON.stringify(assignment),
      }),
    revokeRole: (userId, roleName) =>
      fetchWithAuth(`/api/admin/rbac/assign/${userId}/${roleName}`, {
        method: 'DELETE',
      }),
    bulkAssignRoles: (assignments) =>
      fetchWithAuth('/api/admin/rbac/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({ assignments }),
      }),
    getAuditLogs: (filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/api/admin/rbac/audit${query ? `?${query}` : ''}`);
    },
  },

  sync: {
    getQueue: () => fetchWithAuth('/api/sync/queue'),
    retry: (taskId) =>
      fetchWithAuth(`/api/sync/retry/${taskId}`, {
        method: 'POST',
      }),
    resync: () =>
      fetchWithAuth('/api/sync/resync', {
        method: 'POST',
      }),
  },
};

export { auth, eventEmitter, EVENTS };
