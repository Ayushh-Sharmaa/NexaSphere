# NexaSphere — Complete Master Product & Architecture Specification (MVP & Beyond)

**Document Version:** 1.0.0  
**Target Repository:** `Ayushh-Sharmaa/NexaSphere`  
**Organization:** NexaSphere Student Community, GL Bajaj Group of Institutions (GLBGI), Mathura  
**Scope:** Full-Stack Architecture, Frontend Components, Design System, Motion Layer, Backend APIs, Data Contracts, Form Pipelines, Security Framework, and Future Roadmap  

---

## Table of Contents
1. [Executive Overview & Community Identity](#1-executive-overview--community-identity)
2. [Product Vision, Mission & Target Audience](#2-product-vision-mission--target-audience)
3. [Full-Stack System Architecture](#3-full-stack-system-architecture)
4. [Exhaustive Codebase & File Tree Breakdown](#4-exhaustive-codebase--file-tree-breakdown)
5. [Frontend Engineering & Core React Components](#5-frontend-engineering--core-react-components)
6. [Layered Motion Hierarchy & Canvas Physics](#6-layered-motion-hierarchy--canvas-physics)
7. [Design Tokens, Typography & CSS Architecture](#7-design-tokens-typography--css-architecture)
8. [Data Layer, Activity Registry & Fallback Mechanics](#8-data-layer-activity-registry--fallback-mechanics)
9. [Recruitment Engine (7-Step Core Team Application)](#9-recruitment-engine-7-step-core-team-application)
10. [Membership Onboarding Flow](#10-membership-onboarding-flow)
11. [Admin Management Portal & Content CRUD](#11-admin-management-portal--content-crud)
12. [Backend Architecture, Express REST API & Supabase](#12-backend-architecture-express-rest-api--supabase)
13. [Serverless & Google Sheets Integration Pipelines](#13-serverless--google-sheets-integration-pipelines)
14. [Security, Institutional Validation & Data Integrity](#14-security-institutional-validation--data-integrity)
15. [End-to-End User Interaction Journeys](#15-end-to-end-user-interaction-journeys)
16. [Operational Manual: Local Setup, Configuration & CI/CD](#16-operational-manual-local-setup-configuration--cicd)
17. [Future Evolution & Scalability Roadmap](#17-future-evolution--scalability-roadmap)

---

## 1. Executive Overview & Community Identity

### 1.1 What is NexaSphere?
**NexaSphere** is the official student-led innovation community, technical society, and digital platform established at **GL Bajaj Group of Institutions (GLBGI), Mathura**. Built by students for students, NexaSphere serves as a bridge connecting classroom academic theory with real-world industry engineering practices, open-source collaboration, competitive programming, design innovation, and technical leadership.

The digital web platform (`NexaSphere Web Platform`) is an interactive Single Page Application (SPA) engineered with React 18 and Vite. It functions simultaneously as:
- An **Interactive Community Showcase**: Displaying upcoming hackathons, past Knowledge Sharing Sessions (KSS), workshops, and core team members.
- A **Recruitment & Intake Portal**: Handling multi-stage applications for core leadership roles and general student memberships with real-time academic validation.
- A **Content & Event Management Hub**: Allowing community organizers to update timelines, announce speaker sessions, and manage participation records without code deployments.

### 1.2 Institutional Identity & Contact Channels
* **Institution:** GL Bajaj Group of Institutions, NH-2, Mathura-Delhi Road, Mathura, Uttar Pradesh 281406, India.
* **Official Community Email:** `nexasphere@glbajajgroup.org`
* **LinkedIn Showcase:** [linkedin.com/showcase/glbajaj-nexasphere/](https://www.linkedin.com/showcase/glbajaj-nexasphere/)
* **WhatsApp Community Hub:** [chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20](https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20)
* **Organizers & Leads:** Ayush Sharma (Founder / Organiser), Tanishk Bansal (Organiser), Tushar Goswami (Core Team Member), Swayam (Core Lead), Aryan (Technical Lead), Vartika (Design & Content Lead), Ankit, Surjeet, Astha, Arya, Roshni, Vikas.

---

## 2. Product Vision, Mission & Target Audience

### 2.1 Core Pillars of NexaSphere
NexaSphere is structured around four foundational pillars:
1. **Learn:** Hands-on workshops, peer learning sessions, masterclasses in modern web development, cloud computing, artificial intelligence, and open-source contribution.
2. **Build:** Collaborative software projects, hackathons, and ideathons where multidisciplinary teams turn conceptual ideas into deployable, functional prototypes.
3. **Share:** The flagship **Knowledge Sharing Session (KSS)** model, where members research emerging technical paradigms (such as Generative AI, Distributed Systems, or Web3) and deliver interactive presentations to their peers.
4. **Innovate:** Fostering competitive spirit through promptathons, algorithm codathons, and tech debates that challenge students to think critically and architect resilient solutions.

### 2.2 Target Audience & Demographics
* **Primary Demographic:** 1st, 2nd, 3rd, and 4th-year undergraduate engineering students enrolled in Computer Science & Engineering (CSE), Artificial Intelligence & Machine Learning (AI & ML), Information Technology (IT), and allied branches at GLBGI.
* **Secondary Demographic:** Non-technical students interested in UI/UX design, event management, technical writing, public relations, photography, and community leadership.
* **Tertiary Demographic:** Alumni, industry mentors, corporate sponsors, and guest speakers who interact with the community for hiring, mentorship, and judge panels.

---

## 3. Full-Stack System Architecture

NexaSphere employs a resilient, hybrid full-stack architecture that combines static client delivery, client-side dynamic motion rendering, edge-based serverless execution, and multi-destination data ingestion.

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT LAYER (SPA)                                   |
|  React 18 + Vite 5 + Custom Motion Layer (Orbitron / Rajdhani / Space Mono / Inter)     |
|                                                                                         |
|  +---------------------+   +---------------------+   +-------------------------------+  |
|  |     App Engine      |   |   Custom Routing    |   |     Motion Physics Layer      |  |
|  | (App.jsx / main.js) |   | (Wipe/PageIn/Modals)|   | (Particle Constellation/Orbs) |  |
|  +----------+----------+   +----------+----------+   +---------------+---------------+  |
+-------------|-------------------------|------------------------------|------------------+
              |                         |                              |
              | REST Data Fetch         | Form Ingestion (POST)        | Theme Toggle
              v                         v                              v
+-----------------------------+ +-------------------------------+ +-----------------------+
|    HYBRID DATA RESOLUTION   | | SERVERLESS FORM INGESTION     | | SUPERNOVA STORM       |
|                             | |                               | | (Canvas Sandstorm)    |
| Try: GET /api/content       | | 1. Vercel Serverless Function | +-----------------------+
| Fail: Bundled JS Data Modules| |    (api/core-team/apply.cjs)  |
| (eventsData.js, teamData.js)| | 2. Google Apps Script Webhook |
+--------------+--------------+ |    (google-apps-script/Code.gs|
               |                +---------------+---------------+
               v                                |
+-----------------------------+                 | Google Sheets API v4
| BACKEND SERVICES (Node/Exp) |                 v
| server/index.js             |       +-----------------------------------+
| • JWT Admin Auth (/api/admin)       | GOOGLE SHEETS LIVE INGESTION      |
| • CRUD Event API            |       | • Core Team Applications Database |
| • Supabase PostgreSQL Sync  |       | • General Membership Registry     |
+--------------+--------------+       +-----------------------------------+
               |
               v
+-----------------------------+
| SUPABASE POSTGRESQL DB      |
| • events table              |
| • activity_events table     |
| • Row Level Security (RLS)  |
+-----------------------------+
```

### 3.1 Key Architectural Strengths
1. **Zero Downtime Fallback (Graceful Degradation):** The frontend contains pre-bundled local data sets (`src/data/`). If the remote API server or Supabase instance is unreachable, the application immediately falls back to local data, guaranteeing that the public website never crashes or displays blank screens.
2. **Cost-Effective Scalability:** Leveraging Vercel/Netlify for static asset delivery and Google Apps Script / Google Sheets as a serverless database allows the platform to handle traffic spikes during college recruitment drives at zero hosting cost.
3. **Institutional Trust & Security:** Strict email validation enforces `@glbajajgroup.org` university email addresses for recruitment applications, filtering unauthorized external submissions.
4. **Vanilla CSS Zero-Dependency Performance:** By avoiding heavy UI component libraries (like Material UI or heavy CSS frameworks), the initial bundle size remains ultra-lean (under 360 KB compressed), loading in milliseconds even on spotty campus Wi-Fi networks.

---

## 4. Exhaustive Codebase & File Tree Breakdown

Below is the complete architectural mapping of every file in the NexaSphere repository:

```
d:/Github/NexaSphere/
├── .github/
│   └── workflows/
│       ├── deploy.yml                   # GitHub Actions pipeline for automated GitHub Pages build & deploy
│       └── README.md                    # Documentation for GitHub Actions workflow
├── api/
│   └── core-team/
│       └── apply.cjs                    # Vercel Serverless Function (CommonJS) for Core Team Google Sheets writes
├── google-apps-script/
│   ├── Code.gs                          # Google Apps Script code for Web App deployment -> Google Sheets
│   └── README.md                        # Step-by-step setup guide for Google Sheets & Apps Script deployment
├── public/
│   └── favicon.ico                      # High-resolution NexaSphere emblem browser tab icon
├── server/
│   ├── data/
│   │   └── content.json                 # Flat JSON file database used as a fallback when Supabase is disabled
│   ├── index.js                         # Production Express.js server (JWT Auth, Event CRUD, Sheet integrations)
│   ├── package.json                     # Server package definitions (express, cors, googleapis, dotenv)
│   ├── package-lock.json                # Locked server dependency tree
│   ├── supabase-schema.sql              # PostgreSQL DDL migrations, tables, indexes, and RLS policies
│   └── vercel.json                      # Serverless routing config for Vercel backend hosting
├── src/
│   ├── assets/
│   │   ├── hero-bg.jpg                  # Optimized space/nebula background asset for hero parallax
│   │   └── images/
│   │       ├── README.md                # Image asset dimensions, formats, and optimization guidelines
│   │       ├── logos/
│   │       │   ├── glbajaj-logo.png     # Official GL Bajaj Group of Institutions institution crest
│   │       │   └── nexasphere-logo.png  # Official NexaSphere glowing futuristic community logo
│   │       └── team/                    # 300x300px circular portraits of core team members
│   │           ├── ankit.png, arya.png, aryan.png, astha.png, ayush.png, placeholder.png,
│   │           ├── roshni.png, surjeet.png, swayam.png, tanishk.png, tushar.png, vartika.png, vikas.png
│   ├── data/                            # Content abstraction layer (Enables non-developers to edit site data)
│   │   ├── README.md                    # Content update manual for community coordinators
│   │   ├── activitiesData.js            # Summary card metadata (titles, icons, descriptions, tags)
│   │   ├── eventsData.js                # Chronological event timeline records (completed/upcoming)
│   │   ├── teamData.js                  # Team roster, roles, social links (LinkedIn, WhatsApp, Email)
│   │   └── activities/                  # Modular activity detail records (Rulebooks, prizes, structure)
│   │       ├── README.md                # Guide on structuring activity modules
│   │       ├── index.js                 # Central registry combining all 8 activity modules
│   │       ├── codathon.js              # Competitive programming format specifications
│   │       ├── hackathon.js             # 24-36hr product hackathon format specifications
│   │       ├── ideathon.js              # Business & tech idea pitching format specifications
│   │       ├── promptathon.js           # Generative AI prompt engineering challenge specs
│   │       ├── workshop.js              # Hands-on coding bootcamp specifications
│   │       ├── insightSession.js        # Knowledge Sharing Session (KSS) specifications
│   │       ├── openSourceDay.js         # Git/GitHub & FOSS contribution drive specifications
│   │       └── techDebate.js            # Technical debate & architecture shootout specs
│   ├── pages/
│   │   ├── README.md                    # Page component architectural conventions
│   │   ├── about/
│   │   │   ├── AboutPage.jsx            # Standalone About page with full mission, history, and values
│   │   │   └── AboutSection.jsx         # Compact About section embedded on the main landing page
│   │   ├── activities/
│   │   │   ├── ActivitiesPage.jsx       # Grid view of all 8 flagship NexaSphere activity categories
│   │   │   ├── ActivitiesSection.jsx    # Landing page activities preview section with filter chips
│   │   │   ├── ActivityDetailPage.jsx   # Deep-dive modal/page for single activity (rules, timeline, perks)
│   │   │   └── README.md                # Activities page documentation
│   │   ├── admin/
│   │   │   └── AdminPage.jsx            # Authenticated administrator portal for live event CRUD operations
│   │   ├── contact/
│   │   │   ├── ContactPage.jsx          # Interactive contact forms, FAQs, email links, WhatsApp community
│   │   │   └── README.md                # Contact page documentation
│   │   ├── events/
│   │   │   ├── EventDetailPage.jsx      # Single event detail modal with registration links & agenda
│   │   │   ├── EventsPage.jsx           # Complete chronological event archive with search and filters
│   │   │   ├── EventsSection.jsx        # Landing page timeline preview of upcoming and past events
│   │   │   └── README.md                # Events system documentation
│   │   ├── home/
│   │   │   ├── HeroSection.jsx          # Futuristic hero banner with stats, kinetic text, and CTAs
│   │   │   └── README.md                # Hero section documentation
│   │   ├── membership/
│   │   │   ├── MembershipPage.jsx       # General student membership intake form (2-section form)
│   │   │   └── README.md                # Membership onboarding documentation
│   │   ├── recruitment/
│   │   │   ├── RecruitmentPage.jsx      # Comprehensive 7-stage Core Team leadership application wizard
│   │   │   └── README.md                # Recruitment engine documentation
│   │   └── team/
│   │       ├── README.md                # Team module documentation
│   │       ├── TeamMemberCard.jsx       # Interactive card component with 3D tilt and spinning borders
│   │       ├── TeamMemberModal.jsx      # Detailed bio modal with social media handles & role breakdown
│   │       ├── TeamPage.jsx             # Full team directory page categorized by domain
│   │       └── TeamSection.jsx          # Landing page team preview carousel/grid
│   ├── shared/                          # Reusable UI primitives, background canvases, and navigation
│   │   ├── CinematicOpening.jsx         # Shard-shatter and typewriter introductory sequence
│   │   ├── Footer.jsx                   # Sticky bottom footer with legal info, social links, and college credits
│   │   ├── Icons.jsx                    # Optimized inline SVG icon library (Bolt, Users, Arrow, Shield, etc.)
│   │   ├── MotionLayer.jsx              # React custom hooks for scroll progress, reveals, and magnetic tilt
│   │   ├── Navbar.jsx                   # Glassmorphic header with active pill indicator and mobile menu
│   │   ├── ParticleBackground.jsx       # HTML5 Canvas constellation particle physics system
│   │   ├── README.md                    # Shared components guide
│   │   └── StormOverlay.jsx             # Supernova sandstorm canvas effect triggered during theme toggle
│   ├── styles/
│   │   ├── README.md                    # Styling architecture and naming conventions
│   │   ├── globals.css                  # CSS custom properties, color palette tokens, typography, resets
│   │   ├── animations.css               # Keyframes, scroll-reveal classes (.pop-in, .pop-word, .pop-left)
│   │   ├── components.css               # Per-component styling (cards, badges, modals, form inputs, buttons)
│   │   └── motion.css                   # Advanced ambient orbs, button breathing pulses, wipe transitions
│   ├── App.jsx                          # Root orchestrator: Routing, state management, cursor, theme controller
│   └── main.jsx                         # React DOM bootstrap entry point
├── index.html                           # HTML5 root with preconnected Google Fonts & meta tags
├── netlify.toml                         # Netlify build configuration & redirect rules
├── package.json                         # Client dependencies, Vite plugins, and build scripts
├── package-lock.json                    # Locked client dependency tree
├── README.md                            # High-level repository readme and quickstart guide
├── vercel.json                          # Vercel SPA routing rewrite rules
└── vite.config.js                       # Vite build configuration, aliases, and server ports
```

---

## 5. Frontend Engineering & Core React Components

### 5.1 Root Orchestrator: `src/App.jsx`
`src/App.jsx` serves as the central control plane of the entire frontend. It manages:
1. **Client-Side Page Navigation:** Tracks the active page (`activeTab`: `'Home' | 'Activities' | 'Events' | 'About' | 'Team' | 'Contact' | 'Recruitment' | 'Membership' | 'Admin' | 'ActivityDetail' | 'EventDetail'`).
2. **Page Transitions (`Wipe` Component):** Coordinates a two-phase CSS clip-path and shimmer transition when navigating between views.
3. **Data Hydration & Synchronization:** On initial mount, it attempts an asynchronous `fetch('/api/content')` from the backend. If successful, it updates state with live event records; if the fetch fails, it silently falls back to `src/data/eventsData.js`.
4. **Theme Controller:** Manages Dark and Light theme states with `localStorage` persistence, while triggering the `StormOverlay` canvas animation on toggles.
5. **Anti-Gravity Cursor System:** Renders a floating, physics-based custom cursor composed of an orb, a motion trail, and an ambient glow halo.

```jsx
// Excerpt from src/App.jsx: Transition & Page State Coordination
function navigateTo(tab, detailData = null) {
  if (tab === activeTab && !detailData) return;
  setWipePhase('out');
  setWiping(true);
  setTimeout(() => {
    setActiveTab(tab);
    if (detailData) {
      if (tab === 'ActivityDetail') setSelectedActivity(detailData);
      if (tab === 'EventDetail') setSelectedEvent(detailData);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setWipePhase('in');
    setTimeout(() => setWiping(false), 320);
  }, 270);
}
```

### 5.2 Anti-Gravity Interactive Cursor Engine
On non-touch devices, `App.jsx` dynamically disables the standard OS cursor (`document.body.style.cursor = 'none'`) and instantiates an interactive anti-gravity cursor:
* **Smoothing Factor:** Employs a linear interpolation (lerp) algorithm with an increased responsiveness coefficient (`0.18`) to smoothly trail the mouse coordinates.
* **Harmonic Bobbing:** Computes a three-wave sinusoidal floating offset:
  $$\Delta y = 6\sin(\phi) + 3\sin(1.7\phi) + 4\sin(0.5\phi)$$
  giving the cursor an organic, levitating orb sensation.
* **Magnetic Expansion:** Dynamically expands in scale ($1.55\times$) when hovering over interactive tags (`<a>`, `<button>`, `[role="button"]`, `[tabindex]`) and contracts ($0.7\times$) on mouse click.

### 5.3 Modular Navigation: `src/shared/Navbar.jsx`
* **Glassmorphism:** Styled with `backdrop-filter: blur(16px)` and semi-transparent backgrounds (`var(--bg-glass)`).
* **Kinetic Pill Indicator:** A high-precision active tab indicator glides across the navigation items using CSS transforms.
* **Mobile Drawer:** Renders a slide-in full-screen navigation modal with stagger-animated links for screens below $768\text{px}$.

### 5.4 Reusable Icon System: `src/shared/Icons.jsx`
Instead of importing a heavy third-party icon library (which adds 150KB+ to the build), NexaSphere implements hand-crafted, hardware-accelerated SVG icons:
- `IconBolt` (Energy / Actions)
- `IconUsers` (Community / Team)
- `IconShieldCheck` (Verification / Security)
- `IconSpark` (Innovation / AI)
- `IconArrowRight`, `IconArrowLeft` (Navigation)
- `IconCalendar`, `IconMapPin`, `IconExternalLink`, `IconSearch`, `IconCheck`

---

## 6. Layered Motion Hierarchy & Canvas Physics

NexaSphere features a 6-tier motion hierarchy designed to create an immersive, cinematic experience without sacrificing 60 FPS performance.

```
+-------------------------------------------------------------------------------+
| LEVEL 1: Loader & Cinematic Opening (CinematicOpening.jsx)                   |
| • Shard-shatter grid, typewriter letter reveal, crack SVG, flash burst        |
+-------------------------------------------------------------------------------+
| LEVEL 2: Ambient Canvases & Parallax Backgrounds                             |
| • ParticleBackground.jsx (Constellation network), AmbientOrbs (5 CSS orbs)   |
+-------------------------------------------------------------------------------+
| LEVEL 3: Scroll-Triggered Entrance Reveals (animations.css)                  |
| • .pop-in, .pop-word, .pop-left, .pop-right, .pop-scale (IntersectionObserver)|
+-------------------------------------------------------------------------------+
| LEVEL 4: Per-Component Micro-Interactions (motion.css & components.css)      |
| • 3D Magnetic card tilt, photo border conic spin, CTA breathing glow pulses  |
+-------------------------------------------------------------------------------+
| LEVEL 5: Page & Tab Transition Wipes (App.jsx)                                |
| • Wipe down/up clip paths, shimmer sweep overlay, logo splash                |
+-------------------------------------------------------------------------------+
| LEVEL 6: Interactive Anti-Gravity Cursor (App.jsx)                            |
| • Tri-wave harmonic float, lag trail, magnetic attraction to clickable tags  |
+-------------------------------------------------------------------------------+
```

### 6.1 Particle Constellation System: `src/shared/ParticleBackground.jsx`
The background features an interactive HTML5 Canvas particle network:
* **Density:** Calculates particle count based on viewport area:
  $$N = \text{clamp}\left(\left\lfloor \frac{W \times H}{14000} \right\rfloor, 40, 110\right)$$
* **Proximity Connections:** For every pair of particles $(i, j)$ with Euclidean distance $d < 120\text{px}$, a dynamic connecting line is rendered with alpha transparency proportional to proximity:
  $$\alpha = \left(1 - \frac{d}{120}\right) \times 0.25$$
* **Interactive Repulsion / Attraction:** Particles subtly accelerate away from the user's cursor position and bounce off viewport edges with dampening.

### 6.2 Supernova Sandstorm Theme Transition: `src/shared/StormOverlay.jsx`
When toggling between Dark Mode and Light Mode, NexaSphere triggers a canvas-based **Supernova Sandstorm**:
* **Particle Population:** Spawns 350 micro-particles at high velocity across the viewport.
* **Physics Model:** Each particle possesses velocity vectors $(\dot{x}, \dot{y})$, turbulence jitter, decay rates, and glowing particle tails.
* **Visual Climax:** As the storm peaks at $350\text{ms}$, the underlying CSS theme variables flip, creating a seamless visual metamorphosis as the dust settles.

### 6.3 Motion Layer React Hooks: `src/shared/MotionLayer.jsx`
1. `useScrollProgress()`: Calculates `window.scrollY / (scrollHeight - innerHeight)` and updates `#scroll-progress` element width.
2. `useNsReveal()`: Attaches an `IntersectionObserver` to elements with `.ns-reveal`, `.pop-in`, `.pop-word` classes to trigger animations on viewport entry.
3. `useHeroParallax()`: Translates hero background and typography at differing velocities based on scroll delta.
4. `useMagneticCards(ref)`: Calculates mouse offsets relative to card center and applies 3D CSS perspective transforms (`rotateX`, `rotateY`).
5. `useNavScrollTint(ref)`: Adds a frosted-glass border and darker background to the Navbar once the user scrolls past $20\text{px}$.

---

## 7. Design Tokens, Typography & CSS Architecture

The visual identity of NexaSphere is built upon a modular CSS custom properties system defined in `src/styles/globals.css`.

### 7.1 Design Tokens (CSS Variables)

```css
:root {
  /* Surface & Background Colors */
  --bg: #07090e;
  --bg-rgb: 7, 9, 14;
  --bg2: #0d1117;
  --card: rgba(13, 17, 23, 0.75);
  --card2: rgba(22, 27, 34, 0.85);
  --card-solid: #0d1117;

  /* Accent Brand Gradients (Cyber-Cyan to Nebula-Purple) */
  --c1: #00f0ff;          /* Cyan Accent */
  --c1-rgb: 0, 240, 255;
  --c2: #7928ca;          /* Purple Accent */
  --c2-rgb: 121, 40, 202;
  --c3: #ff0080;          /* Pink/Magenta Highlight */
  --c3-rgb: 255, 0, 128;
  --c4: #ffaa00;          /* Warning / Gold Accent */

  /* Text Colors */
  --t1: #f0f6fc;          /* Primary Header Text */
  --t2: #8b949e;          /* Secondary Body Text */
  --t3: #484f58;          /* Muted / Placeholder Text */

  /* Borders & Glow Effects */
  --bdr: rgba(255, 255, 255, 0.08);
  --bdr2: rgba(0, 240, 255, 0.25);
  --glow: rgba(0, 240, 255, 0.15);
  --glow-strong: rgba(0, 240, 255, 0.4);

  /* Border Radii */
  --r1: 6px;
  --r2: 12px;
  --r3: 20px;
  --r-full: 9999px;
}
```

### 7.2 Typography Scale & Google Fonts
* **`Orbitron` (Display & Title Font):** Used for main hero titles, activity banners, and futuristic countdown timers.
* **`Rajdhani` (Headers & Navigation):** Bold, condensed geometric sans-serif for section headers, card titles, and navigation buttons.
* **`Space Mono` (Code & Meta Labels):** Monospace font for dates, event tags, academic IDs, and domain badges.
* **`Inter` (Body & Long-form Text):** Clean, highly legible neutral sans-serif for descriptions, form inputs, and legal disclaimers.

---

## 8. Data Layer, Activity Registry & Fallback Mechanics

The data layer in `src/data/` isolates all site content from JSX markup, allowing any team member to update events, team profiles, or activity guidelines by editing plain JavaScript objects.

### 8.1 Activity Modules Registry (`src/data/activities/`)
Each activity format is represented by a dedicated configuration object registered in `src/data/activities/index.js`:

| Activity Identifier | Title | Domain / Format | Description |
|---|---|---|---|
| `Hackathon` | Hackathon | Technical / 24-36hr Sprint | Rapid software/hardware prototype building under time constraints. |
| `Codathon` | Codathon | Competitive Coding | Algorithm contests testing DSA, logic, and speed. |
| `Ideathon` | Ideathon | Innovation & Pitching | Pitching technology solutions for social and enterprise problems. |
| `Promptathon` | Promptathon | Generative AI Challenge | Optimizing LLM prompt chains, agents, and generative workflows. |
| `Workshop` | Workshop | Hands-on Bootcamp | Step-by-step masterclasses (Git, Cloud, Docker, React, Machine Learning). |
| `Insight Session` | Insight Session (KSS) | Peer-to-Peer Learning | Community-led research presentations (e.g., KSS #153: Impact of AI). |
| `Open Source Day` | Open Source Day | Contribution Drive | Guided Git pull requests, issue resolution, and open-source ethics. |
| `Tech Debate` | Tech Debate | Critical Analysis | Structured architectural debates (e.g. Monolith vs Microservices). |

### 8.2 Activity Data Schema Example (`src/data/activities/promptathon.js`)
```javascript
export default {
  title: 'Promptathon',
  subtitle: 'Master the Art of Generative AI & Prompt Engineering',
  category: 'Artificial Intelligence',
  badge: 'AI Flagship',
  overview: 'A competitive arena where participants solve complex problems using prompt engineering, LLM orchestration, and autonomous agents.',
  structure: [
    { phase: 'Round 1: Rapid Prompting', duration: '45 Mins', description: 'Solving logic puzzles via constrained prompt templates.' },
    { phase: 'Round 2: Agent Architecture', duration: '90 Mins', description: 'Building autonomous tool-calling agents for specific business tasks.' }
  ],
  guidelines: [
    'Participants may use Claude, GPT-4, or open-weight models.',
    'Evaluation is based on output accuracy, token efficiency, and robustness against hallucinations.'
  ],
  prizes: ['Certificates of Excellence', 'Exclusive AI Research Mentorship', 'Community Leader Badge']
};
```

### 8.3 Events Timeline Schema (`src/data/eventsData.js`)
```javascript
export const events = [
  {
    id: 1,
    name: 'KSS #153 — Knowledge Sharing Session',
    shortName: 'KSS #153',
    date: 'March 14, 2025',
    description: "NexaSphere's inaugural Knowledge Sharing Session focused on the Impact of AI, fostering peer collaboration and curiosity.",
    status: 'completed', // 'completed' | 'upcoming'
    icon: '🧠',
    tags: ['AI', 'Learning', 'Community']
  },
  {
    id: 2,
    name: 'Workshop: Git & GitHub Mastery',
    shortName: 'Git & GitHub',
    date: 'April 24, 2025',
    description: 'Version control mastery for modern developers. Learn branch management, PR workflows, and open-source etiquette.',
    status: 'upcoming',
    icon: '🔧',
    tags: ['Git', 'GitHub', 'Workshop']
  }
];
```

---

## 9. Recruitment Engine (7-Step Core Team Application)

The **Recruitment Engine** ([`src/pages/recruitment/RecruitmentPage.jsx`](file:///d:/Github/NexaSphere/src/pages/recruitment/RecruitmentPage.jsx)) is a multi-step interactive wizard designed to vet candidates applying for leadership roles.

### 9.1 Multi-Stage Application Steps

```
[ Step 1: Personal Info ]
      │  • Full Name
      │  • WhatsApp (10 digits)
      │  • College Email (@glbajajgroup.org)
      ▼
[ Step 2: Academic Profile ]
      │  • Year (1st, 2nd, 3rd, 4th Year)
      │  • Branch (CSE, AI & ML, IT, ME, etc.)
      │  • Class Section
      ▼
[ Step 3: Domain Selection ]
      │  • Technical (Web / App / AI / DevOps)
      │  • Management & Operations
      │  • Media, Graphics & UI/UX
      │  • Content & Documentation
      │  • Public Relations & Sponsorships
      ▼
[ Step 4: Skills & Portfolio ]
      │  • Skill Matrix Checklist
      │  • GitHub / Portfolio / LinkedIn Links
      │  • Communication Self-Rating (1-10)
      ▼
[ Step 5: Commitment & Availability ]
      │  • Weekly Hours Available (5-10, 10-15, 15+ hrs)
      │  • Weekend Campus Event Attendance (Yes/No)
      │  • Assessment Task Acceptance
      ▼
[ Step 6: Statement of Purpose ]
      │  • Why do you want to join NexaSphere?
      │  • What unique value will you bring?
      │  • Past leadership or club experience
      ▼
[ Step 7: Integrity Declaration ]
      │  • Honor Code Agreement
      │  • Submission & Instant Google Sheets Ingestion
```

### 9.2 Validation & Submission Logic
1. **Client-Side Sanitization:** Validates required fields at each transition step before allowing the user to proceed.
2. **Domain-Specific Institutional Check:** Verifies that the entered email ends with `@glbajajgroup.org`.
3. **Payload Dispatch:** Submits JSON payload to `/api/core-team/apply` (or fallback Google Apps Script endpoint) with user-agent, timestamp, and structured array values.

---

## 10. Membership Onboarding Flow

The **Membership Portal** ([`src/pages/membership/MembershipPage.jsx`](file:///d:/Github/NexaSphere/src/pages/membership/MembershipPage.jsx)) provides a frictionless, two-section onboarding form for general students wanting to join the community:

* **Section A: Student Identity**
  * Full Name
  * College Email ID (`@glbajajgroup.org`)
  * WhatsApp Phone Number
  * Academic Year & Branch
* **Section B: Areas of Interest & Goals**
  * Checkbox matrix: Web Dev, AI/ML, Cloud/DevOps, Cyber Security, Competitive Programming, UI/UX Design, Event Management.
  * What do you hope to achieve through NexaSphere?
* **Instant Welcome:** Upon submission, the student receives instant confirmation and a direct invitation link to the private NexaSphere WhatsApp Community group.

---

## 11. Admin Management Portal & Content CRUD

The **Admin Portal** ([`src/pages/admin/AdminPage.jsx`](file:///d:/Github/NexaSphere/src/pages/admin/AdminPage.jsx)) provides community organizers with a secure interface for managing site events and announcements.

### 11.1 Authentication & Security Flow
1. **Credentials Dispatch:** The administrator inputs username and password. The frontend executes a `POST /api/admin/login` request.
2. **JWT Token Storage:** The server returns a signed JWT token which is persisted in `localStorage` under `ns_admin_token`.
3. **Authorized API Calls:** Subsequent requests include `Authorization: Bearer <token>` in HTTP headers.

### 11.2 Admin CRUD Capabilities
* **Create Event:** Specify event title, short code, event date, emoji icon, category tags, and description.
* **Update Event Status:** Toggle between `upcoming` and `completed` in real time.
* **Delete Event:** Permanently remove an event from the database with confirmation prompt.
* **Dual-Write Engine:** The API writes modifications to the Supabase database if configured; otherwise, it persists changes to `server/data/content.json`.

---

## 12. Backend Architecture, Express REST API & Supabase

The backend (`server/index.js`) is an Express.js application designed to handle admin sessions, database synchronization, and Google Sheets form ingestion.

### 12.1 REST API Endpoints Specification

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check returning status, timestamp, and database mode. |
| `GET` | `/api/content` | No | Fetches all public events and activity event mappings. |
| `POST` | `/api/admin/login` | No | Authenticates admin credentials and returns JWT token. |
| `GET` | `/api/admin/verify` | Yes (Bearer) | Validates active admin JWT token. |
| `GET` | `/api/admin/events` | Yes (Bearer) | Returns all events (including drafts and archives). |
| `POST` | `/api/content/events` | Yes (Bearer) | Creates a new event record. |
| `PUT` | `/api/content/events/:id` | Yes (Bearer) | Updates an existing event record. |
| `DELETE` | `/api/content/events/:id` | Yes (Bearer) | Deletes an event record. |
| `POST` | `/api/core-team/apply` | No | Ingests Core Team application and writes to Google Sheets. |
| `POST` | `/api/membership` | No | Ingests student membership registration into Google Sheets. |

### 12.2 Supabase PostgreSQL Schema (`server/supabase-schema.sql`)
When connected to Supabase, the database executes the following relational schema:

```sql
-- Events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'draft')),
  icon TEXT NOT NULL DEFAULT '📌',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Events Table
CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  venue TEXT,
  speaker TEXT,
  registration_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Public Read Policy
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public Read Activity Events" ON activity_events FOR SELECT USING (true);
```

---

## 13. Serverless & Google Sheets Integration Pipelines

To eliminate database hosting costs and allow non-technical organizers to view applicants in spreadsheet format, NexaSphere routes submissions directly into Google Sheets using two parallel approaches:

### 13.1 Pipeline A: Vercel Serverless Function (`api/core-team/apply.cjs`)
* **Environment Variables:** `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB_NAME`.
* **Execution:** Initializes `google.auth.JWT` with scope `https://www.googleapis.com/auth/spreadsheets`.
* **Row Formatting:** Formats incoming applicant fields into a standard row array and invokes `sheets.spreadsheets.values.append()` with `USER_ENTERED` parsing.

### 13.2 Pipeline B: Google Apps Script Webhook (`google-apps-script/Code.gs`)
For zero-dependency deployment directly via Google Apps Script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses") 
                || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Validate institutional domain
    if (!data.collegeEmail || !data.collegeEmail.toLowerCase().endsWith("@glbajajgroup.org")) {
      return ContentService.createTextOutput(JSON.stringify({ 
        ok: false, 
        error: "Institutional email required." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var row = [
      new Date(),
      data.fullName || "",
      data.collegeEmail || "",
      data.whatsapp || "",
      data.year || "",
      data.branch || "",
      data.section || "",
      data.role || "",
      Array.isArray(data.interests) ? data.interests.join(", ") : (data.interests || ""),
      data.skills || "",
      data.comms || "",
      data.campusExp || "",
      data.links || "",
      data.commitHours || "",
      data.whyJoin || "",
      data.declaration || "Accepted"
    ];

    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 14. Security, Institutional Validation & Data Integrity

1. **Strict Institutional Regex:**
   ```javascript
   function isGlBajajEmail(email) {
     const clean = String(email || '').trim().toLowerCase();
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) && clean.endsWith('@glbajajgroup.org');
   }
   ```
2. **Phone Number Sanitization:** Enforces standard 10-digit Indian mobile numbers (`/^\d{10}$/`).
3. **JWT Admin Encryption:** All admin session tokens are signed with SHA-256 HMAC utilizing a secret server key and 24-hour expiration.
4. **CORS Security:** Restricts Cross-Origin requests to configured domains (`localhost:5173`, `nexasphere-glbajaj.vercel.app`, `nexasphere.netlify.app`).
5. **Payload Limiting:** Express body parser enforces strict `512kb` payload limits to mitigate Denial of Service (DoS) memory consumption.

---

## 15. End-to-End User Interaction Journeys

### 15.1 Journey 1: First-Time Visitor Discovery
1. Student navigates to the NexaSphere URL.
2. The **Cinematic Opening** triggers: A glowing shard grid shatters with audio-visual impact, displaying the NexaSphere emblem and typewriter motto.
3. The user lands on the **Hero Section**, greeted by dynamic statistics (active members, workshops, events held) and particle constellation physics.
4. The user clicks **"Explore Activities"**: The screen undergoes a cyan-purple **Page Wipe**, smoothly mounting the **Activities Hub**.
5. The user selects **"Promptathon"**: A 3D tilt detail modal expands with full rules, structure, and criteria.

### 15.2 Journey 2: Core Team Application Process
1. Student clicks **"Join Core Team"** on the Navbar.
2. The 7-step **Recruitment Wizard** loads.
3. Step 1 enforces their `@glbajajgroup.org` university email and 10-digit WhatsApp number.
4. The student navigates through Academic info, Domain selection (e.g. Technical Track), Skill checklist, and Time Commitment.
5. In Step 6, they write their Statement of Purpose explaining their vision for the community.
6. In Step 7, they accept the integrity declaration and click **"Submit Application"**.
7. The application transmits to the backend serverless pipeline, logs the record into the organizers' Google Sheet, and renders a celebratory confirmation modal.

### 15.3 Journey 3: Organizer Live Event Publishing
1. Community lead navigates to `/admin` and logs in with administrative credentials.
2. The admin dashboard fetches all current events from Supabase/server.
3. The organizer fills in the **New Event Form**: Title *"AI Agent Hackathon 2025"*, Date *"October 12"*, Tags `["AI", "Agents", "Hackathon"]`.
4. Upon clicking **"Publish Event"**, the REST API updates the database.
5. Next time any student loads the **Events Page**, the new hackathon instantly appears with an *Upcoming* badge.

---

## 16. Operational Manual: Local Setup, Configuration & CI/CD

### 16.1 Local Development Environment

```bash
# Clone the repository
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere

# 1. Install client dependencies
npm install

# 2. Launch Vite development server
npm run dev
# Server boots at: http://localhost:5173

# 3. Build for production
npm run build
# Outputs optimized static bundle to dist/
```

### 16.2 Running the Express Server

```bash
# Navigate to server directory
cd server

# Install server dependencies
npm install

# Start backend server
npm start
# Backend runs at: http://localhost:5000
```

### 16.3 GitHub Actions Automated Deployment (`.github/workflows/deploy.yml`)
Every push to the `main` branch triggers an automated GitHub Actions CI workflow:
1. Provisions an Ubuntu runner with Node.js 18.
2. Cleans cached dependencies and executes `npm install`.
3. Runs `npm run build` to compile the Vite production bundle into `./dist`.
4. Deploys the `./dist` directory directly to GitHub Pages with zero manual intervention.

---

## 17. Future Evolution & Scalability Roadmap

The NexaSphere platform is architected for long-term expansion across several upcoming development phases:

```
+-------------------------------------------------------------------------------+
| PHASE 1: Real-Time Interactive LMS & Code Playgrounds                         |
| • In-browser JavaScript / Python sandbox for workshop coding labs             |
| • Progress tracking for student workshop attendees with milestone badges      |
+-------------------------------------------------------------------------------+
| PHASE 2: Live KSS Streaming & Discord/WhatsApp Bot Integration                |
| • Live stream embeds directly on event pages during Knowledge Sharing Sessions|
| • Automated Discord webhook & WhatsApp bot notifications for new events       |
+-------------------------------------------------------------------------------+
| PHASE 3: Cryptographically Verifiable Digital Certificates                    |
| • Automated certificate generation for event winners and attendees            |
| • Public verification page (e.g., /verify/:certificateId) with QR validation   |
+-------------------------------------------------------------------------------+
| PHASE 4: Enterprise Microservices Migration (Java Spring Boot + FastAPI)       |
| • Migration to Java 21 (Spring Boot 3) API server for high-throughput CRUD    |
| • Python FastAPI microservice for AI evaluation & intelligent resume parsing  |
+-------------------------------------------------------------------------------+
```

---

## 18. Conclusion

NexaSphere represents a modern, production-grade web platform combining **visual excellence, zero-cost serverless scalability, institutional security, and rich interactive animations**. By uniting student organizers, learners, and mentors under a unified digital roof, NexaSphere empowers the student community of GL Bajaj Group of Institutions to learn, build, share, and lead the future of technology.

---
*Authored for NexaSphere Community by the Core Engineering Team.*
