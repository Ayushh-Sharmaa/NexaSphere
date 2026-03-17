# ⬡ NexaSphere
### GL Bajaj Group of Institutions, Mathura
**Student-Driven Tech Ecosystem**

> Built with React + Vite · Hosted on GitHub Pages · Auto-deployed via GitHub Actions

[![Live Site](https://img.shields.io/badge/🌐_Live_Site-NexaSphere-00d4ff?style=for-the-badge)](https://ayushh-sharmaa.github.io/NexaSphere/)
[![GitHub Repo](https://img.shields.io/badge/📦_Repo-GitHub-6366f1?style=for-the-badge)](https://github.com/Ayushh-Sharmaa/NexaSphere)
[![WhatsApp](https://img.shields.io/badge/💬_Community-WhatsApp-25d366?style=for-the-badge)](https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20)
[![LinkedIn](https://img.shields.io/badge/🔗_LinkedIn-NexaSphere-0a66c2?style=for-the-badge)](https://www.linkedin.com/showcase/glbajaj-nexasphere/)

---

## 📌 Table of Contents

- [Quick Links](#-quick-links)
- [Tech Stack](#️-tech-stack)
- [Folder Structure](#-folder-structure)
- [Data Files](#-data-files--srcdata)
- [Activity Pages Data](#-activity-pages-data--srcdataactivities)
- [Components](#-components--srccomponents)
- [Styles](#-styles--srcstyles)
- [Root Files](#️-root-files)
- [Page Navigation Flow](#-page-navigation-flow)
- [Common Tasks — Quick Reference](#-common-tasks--quick-reference)
- [Core Team](#-core-team)
- [Activities](#-activities)
- [Deployment](#-deployment)

---

## 🔗 Quick Links

| Label | URL |
|---|---|
| 🌐 Live Website | https://ayushh-sharmaa.github.io/NexaSphere/ |
| 📦 GitHub Repo | https://github.com/Ayushh-Sharmaa/NexaSphere |
| 💬 WhatsApp Community | https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20 |
| 🔗 LinkedIn Page | https://www.linkedin.com/showcase/glbajaj-nexasphere/ |
| 📋 Core Team Application | https://forms.gle/nhUxj9SP8tJ3McfG8 |
| 📄 Core Team Roles | https://tinyurl.com/NexaSphere-CTR |
| 📜 Code of Conduct | https://tinyurl.com/NexaSphere-COD |
| 📏 Rules & Regulations | https://tinyurl.com/NexaSphere-Rules |
| 📝 Terms & Conditions | https://tinyurl.com/NexaSphere-TNC |

---

## ⚙️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| GitHub Actions | latest | Auto-deploy CI/CD |
| GitHub Pages | — | Free hosting |
| Orbitron | Google Fonts | Heading font |
| Rajdhani | Google Fonts | Body font |

---

## 📁 Folder Structure

> Every file the website uses lives inside `src/`. Root files control build & deploy only.

```
NexaSphere/
├── public/
│   └── favicon.ico                            ← Browser tab icon
│
├── src/
│   ├── assets/
│   │   ├── hero-bg.jpg                        ← Hero section background photo
│   │   └── images/
│   │       ├── logos/
│   │       │   ├── nexasphere-logo.png        ← NexaSphere logo (transparent bg)
│   │       │   └── glbajaj-logo.png           ← GL Bajaj logo (transparent bg)
│   │       └── team/
│   │           ├── ayush.png
│   │           ├── tanishk.png
│   │           ├── tushar.png
│   │           ├── swayam.png
│   │           ├── aryan.png
│   │           ├── vartika.png
│   │           ├── arya.png
│   │           ├── astha.png
│   │           ├── ankit.png
│   │           ├── vikas.png
│   │           ├── surjeet.png
│   │           ├── roshni.png
│   │           └── placeholder.png            ← Default for members without photo
│   │
│   ├── components/
│   │   ├── Navbar.jsx                         ← Top navigation bar
│   │   ├── HeroSection.jsx                    ← Full-screen landing section
│   │   ├── ActivitiesSection.jsx              ← Clickable activity cards grid
│   │   ├── ActivityDetailPage.jsx             ← Activity detail page (events listed)
│   │   ├── EventDetailPage.jsx                ← Single event detail page (KSS etc.)
│   │   ├── EventsSection.jsx                  ← Events timeline on main page
│   │   ├── AboutSection.jsx                   ← About section
│   │   ├── TeamSection.jsx                    ← Team card grid
│   │   ├── TeamMemberCard.jsx                 ← Individual team card with 3D tilt
│   │   ├── TeamMemberModal.jsx                ← Portal-based member popup modal
│   │   ├── ParticleBackground.jsx             ← Canvas particle animation
│   │   └── Footer.jsx                         ← Bottom footer
│   │
│   ├── data/
│   │   ├── teamData.js                        ← All 12 team members
│   │   ├── eventsData.js                      ← Events timeline (main page)
│   │   ├── activitiesData.js                  ← Activity card titles, icons, descriptions
│   │   └── activities/                        ← ⭐ One file per activity type
│   │       ├── index.js                       ← Master import — do not edit
│   │       ├── hackathon.js
│   │       ├── codathon.js
│   │       ├── ideathon.js
│   │       ├── workshop.js
│   │       ├── insightSession.js              ← Contains KSS #153 full data
│   │       ├── openSourceDay.js
│   │       └── techDebate.js
│   │
│   ├── styles/
│   │   ├── globals.css                        ← CSS variables, reset, fonts, scroll, cursor
│   │   ├── animations.css                     ← All keyframes + reveal utility classes
│   │   └── components.css                     ← All component styles
│   │
│   ├── App.jsx                                ← Root component + page routing
│   └── main.jsx                               ← React entry point
│
├── .github/
│   └── workflows/
│       └── deploy.yml                         ← Auto-deploy to GitHub Pages
│
├── index.html
├── vite.config.js
└── package.json
```

---

## 📊 Data Files — `src/data/`

> **This is where all website content lives.** You never need to touch component code to update content.

---

### `teamData.js` — Team Members

**Path:** `src/data/teamData.js`

Controls everything on the **Team page** and inside each member's **modal popup**.

#### Fields for each member

| Field | Type | What it does | If `null` |
|---|---|---|---|
| `id` | number | Unique ID (do not repeat) | — |
| `name` | string | Full name on card & modal | — |
| `role` | string | Role shown in cyan below name | — |
| `year` | string | e.g. `"1st Year"` | — |
| `branch` | string | e.g. `"CSE (AI & ML)"` | — |
| `section` | string | e.g. `"F"` | — |
| `photo` | import | Circular profile photo | Shows placeholder |
| `linkedin` | string | Opens LinkedIn in new tab | Button hidden |
| `email` | string | Click → shows email + copy button | Button hidden |
| `whatsapp` | string | Click → shows number + copy button | Button hidden |
| `instagram` | string | Opens Instagram in new tab | Button hidden |

> **WhatsApp note:** Can be a plain number `'9876543210'` or a full URL `'https://wa.me/...'` — both work.

#### How to add a new member

1. Add photo to `src/assets/images/team/yourname.png` *(circular crop, 300×300px)*
2. Add import at top of `teamData.js`:
   ```js
   import yournameImg from '../assets/images/team/yourname.png';
   ```
3. Copy any existing member block, give it a new unique `id`, fill in details
4. Set unused social fields to `null` — button disappears automatically

#### How to change member order

Reorder the objects in the `teamMembers` array — grid follows array order exactly.

---

### `eventsData.js` — Events Timeline

**Path:** `src/data/eventsData.js`

Controls the **Events tab** on the main page.

| Field | Type | What it does |
|---|---|---|
| `id` | number | Unique ID |
| `name` | string | Full event name |
| `shortName` | string | Short abbreviation |
| `date` | string | Display date e.g. `"March 14, 2025"` |
| `description` | string | Paragraph in the event card |
| `status` | `"completed"` \| `"upcoming"` | Filled dot vs pulsing dot |
| `icon` | emoji | Large emoji beside event name |
| `tags` | `string[]` | Tag chips below description |

---

### `activitiesData.js` — Activity Cards

**Path:** `src/data/activitiesData.js`

Controls the **7 clickable cards** on the Activities section. Each opens its own detail page.

| Field | What it does |
|---|---|
| `id` | Unique ID |
| `icon` | Large emoji at top of card |
| `title` | Card heading — **must exactly match** the key in `src/data/activities/index.js` |
| `description` | Body text below the heading |

---

## ⭐ Activity Pages Data — `src/data/activities/`

> Each activity type has its own file. To update an activity's events, **only edit that one file**.

### File map

| File | Activity | Accent Color |
|---|---|---|
| `hackathon.js` | Hackathon | `#00d4ff` cyan |
| `codathon.js` | Codathon | `#6366f1` indigo |
| `ideathon.js` | Ideathon | `#f59e0b` amber |
| `workshop.js` | Workshop | `#10b981` green |
| `insightSession.js` | Insight Session | `#a855f7` purple |
| `openSourceDay.js` | Open Source Day | `#06b6d4` sky |
| `techDebate.js` | Tech Debate | `#ef4444` red |
| `index.js` | Master export | — do not edit — |

### Event block structure (copy this template)

```js
{
  id: 'unique-event-id',           // e.g. 'kss-154'
  name: 'Full Event Name',
  shortName: 'Short Name',
  date: 'Month Year',
  status: 'completed',             // or 'upcoming'
  tagline: 'One line teaser',
  stats: [
    { label: 'Speakers', value: '3' },
    { label: 'Attendees', value: '40+' },
  ],
  overview: 'Full session description...',
  topics: [
    {
      title: 'Topic Title',
      speaker: 'Speaker Name',
      role: 'Presenter',
      duration: '15 min',
      summary: 'Brief summary...',
    },
  ],
  videoPresenter: [{ name: 'Name', role: 'Video Presentor' }],
  anchor: { name: 'Name', role: 'Anchor' },
  volunteers: [{ name: 'Name' }],
  acknowledgements: [
    { name: 'Prof. Name', title: 'Title', note: 'Thank you message...' },
  ],
  closingNote: 'Closing message...',
  photoLink: null,                 // Add Google Drive link when ready
  videoLink: null,                 // Add YouTube link when ready
  hashtags: ['#Tag1', '#Tag2'],
}
```

### How to add a new KSS session

1. Open `src/data/activities/insightSession.js`
2. Copy the KSS #153 block inside `conductedEvents`
3. Update `id`, `name`, `date`, `overview`, `topics`, team members etc.
4. Commit — page updates automatically

### How to add photo/video links

```js
photoLink: 'https://drive.google.com/your-link',
videoLink: 'https://youtube.com/your-link',
```
Buttons appear on the event detail page automatically when links are set.

---

## 🧩 Components — `src/components/`

| File | What it renders | When to edit |
|---|---|---|
| `Navbar.jsx` | Top nav bar (desktop + mobile) | Add/remove tabs, logo sizes, scroll behavior |
| `HeroSection.jsx` | Full-screen landing — orbit rings, data streams, letter-drop title, stats bar | Title, tagline, buttons, stats numbers |
| `ActivitiesSection.jsx` | All 7 clickable cards — each opens its detail page | Card layout, hover effects, section heading |
| `ActivityDetailPage.jsx` | Detail page for any activity — lists conducted & upcoming events | Visual/layout only |
| `EventDetailPage.jsx` | Full event detail — overview, topics, team credits, media links, hashtags | Visual/layout only |
| `EventsSection.jsx` | Timeline on main page | Timeline layout, dot styles |
| `AboutSection.jsx` | About text + values card + social buttons | About text, values list, button links |
| `TeamSection.jsx` | Team card grid + modal trigger | Grid layout, columns |
| `TeamMemberCard.jsx` | Individual card with 3D tilt | Card size, photo size, click hint |
| `TeamMemberModal.jsx` | Portal-based popup with copy buttons for email & WhatsApp | Modal layout, social buttons |
| `ParticleBackground.jsx` | Canvas particle field with connection lines | Particle count, speed, colors |
| `Footer.jsx` | Bottom footer | Copyright text, links |

> `TeamMemberModal` uses React `createPortal()` — renders into `document.body` so it's never clipped by any parent.

---

## 🎨 Styles — `src/styles/`

### `globals.css`

CSS variables, body reset, fonts, scrollbar, scroll progress bar, back-to-top button.

#### To change colors site-wide — edit `:root {}` at the top:

```css
--cyan:       #00d4ff;   /* Primary accent — headings, borders, glows */
--indigo:     #6366f1;   /* Secondary accent */
--purple:     #a855f7;   /* Tertiary accent */
--bg-primary: #04060f;   /* Page background */
--bg-card:    #0d1229;   /* Card background */
```

---

### `animations.css`

All `@keyframe` animations and scroll-reveal utility classes.

#### Scroll reveal classes

| Class | Effect |
|---|---|
| `.reveal` | Fade up from below |
| `.reveal-left` | Slide in from left |
| `.reveal-right` | Slide in from right |
| `.reveal-scale` | Scale up from 88% |
| `.reveal-delay-1` to `.reveal-delay-6` | Stagger delays (0.08s increments) |

Add any class to an element — it animates in automatically when scrolled into view.

---

### `components.css`

Styles for every component. If something looks visually wrong, check here first.

---

## 🗂️ Root Files

| File | Purpose | When to edit |
|---|---|---|
| `src/App.jsx` | Root component — wipe transitions, dual cursor, scroll, routing | Adding new sections or changing routing |
| `src/main.jsx` | React entry point | Almost never |
| `index.html` | HTML shell — title, favicon, fonts | Change tab title or add meta tags |
| `vite.config.js` | Sets `base: "/NexaSphere/"` for GitHub Pages | Only if repo is renamed |
| `package.json` | Dependencies & scripts | Adding/removing packages |
| `.github/workflows/deploy.yml` | CI/CD — auto-builds on every push to `main` | Changing Node version or deploy branch |

---

## 🗺️ Page Navigation Flow

```
Main Page
├── Hero Section
├── Activities Section  ← click any of the 7 cards
│     └── Activity Detail Page
│           └── Conducted Event Card  ← click to open
│                 └── Event Detail Page
│                       ├── Session Overview  (typewriter effect)
│                       ├── Topics Covered    (numbered slide cards)
│                       ├── Presenters
│                       ├── Video Presentors & Anchor
│                       ├── Volunteers        (chip badges)
│                       ├── Special Thanks    (acknowledgements)
│                       ├── Photos & Videos   (add links in data file)
│                       ├── Closing Note
│                       └── Hashtags          (hoverable chips)
├── Events Section      (standalone timeline)
├── About Section
├── Team Section        ← click any card → modal popup
└── Footer
```

**Page transitions:** Every navigation uses a cinematic wipe — dark panel sweeps down with NexaSphere logo flash, then reveals new page.

**Dual cursor:** Large lagging glow orb + precise cyan dot track the mouse on desktop.

---

## ✅ Common Tasks — Quick Reference

| Task | File to edit | What to change |
|---|---|---|
| Add a team member | `src/data/teamData.js` | Add object to array + import photo |
| Add a member photo | `src/assets/images/team/` | Add circular PNG (300×300px) |
| Update member LinkedIn | `src/data/teamData.js` | Set `linkedin: "https://..."` |
| Update member WhatsApp | `src/data/teamData.js` | Set `whatsapp: "9876543210"` |
| Update member email | `src/data/teamData.js` | Set `email: "name@example.com"` |
| Change member role | `src/data/teamData.js` | Edit `role:` field |
| Reorder team members | `src/data/teamData.js` | Reorder objects in array |
| Add event to main timeline | `src/data/eventsData.js` | Add object to `events` array |
| Mark timeline event completed | `src/data/eventsData.js` | Change `status` to `"completed"` |
| Add new KSS session | `src/data/activities/insightSession.js` | Copy KSS #153 block into `conductedEvents` |
| Add KSS photo link | `src/data/activities/insightSession.js` | Set `photoLink: "https://..."` |
| Add KSS video link | `src/data/activities/insightSession.js` | Set `videoLink: "https://..."` |
| Add Hackathon event | `src/data/activities/hackathon.js` | Copy template into `conductedEvents` |
| Add Workshop event | `src/data/activities/workshop.js` | Copy template into `conductedEvents` |
| Edit activity card description | `src/data/activitiesData.js` | Edit `description:` field |
| Change site colors | `src/styles/globals.css` | Edit `--cyan`, `--indigo`, `--purple` in `:root {}` |
| Change page background | `src/styles/globals.css` | Edit `--bg-primary` |
| Change hero background photo | `src/assets/hero-bg.jpg` | Replace file (keep same filename) |
| Change logos | `src/assets/images/logos/` | Replace the PNG files |
| Change browser tab title | `index.html` | Edit `<title>` tag |
| Change footer text | `src/components/Footer.jsx` | Edit JSX text |
| Change hero stats numbers | `src/components/HeroSection.jsx` | Edit `stats` array in `HeroStats` |
| Change WhatsApp community link | `src/components/HeroSection.jsx` + `AboutSection.jsx` | Update `WHATSAPP_URL` constant |
| Change particle speed/count | `src/components/ParticleBackground.jsx` | Edit `COUNT`, `dx`/`dy`, connection distance |
| Rename GitHub repo | `vite.config.js` | Update `base: "/NewRepoName/"` |

---

## 👥 Core Team

| Name | Role | Year | Branch | Section |
|---|---|---|---|---|
| Ayush Sharma | Organiser | 1st | CSE (AI & ML) | F |
| Tanishk Bansal | Co-organiser | 1st | CSE | E |
| Tushar Goswami | Core Team Member | 1st | CSE (AI & ML) | J |
| Swayam Dwivedi | Core Team Member | 1st | CSE | E |
| Aryan Singh | Core Team Member | 1st | CS (AI & ML) | F |
| Vartika Sharma | Core Team Member | 1st | CS | J |
| Arya Kaushik | Core Team Member | 1st | CS (AI & ML) | F |
| Astha Shukla | Core Team Member | 1st | CS (AI & ML) | G |
| Ankit Singh | Core Team Member | 1st | CS | F |
| Vikas Kumar Sharma | Core Team Member | 1st | CSE | E |
| Suryjeet Singh | Core Team Member | 1st | CS | J |
| Roshni Gupta | Core Team Member | 2nd | CST | E |

---

## ⚡ Activities

| Activity | Accent Color | Conducted Events |
|---|---|---|
| Hackathon | Cyan `#00d4ff` | None yet |
| Codathon | Indigo `#6366f1` | None yet |
| Ideathon | Amber `#f59e0b` | None yet |
| Workshop | Green `#10b981` | None yet |
| Insight Session | Purple `#a855f7` | **KSS #153 — Impact of AI ✅** |
| Open Source Day | Sky `#06b6d4` | None yet |
| Tech Debate | Red `#ef4444` | None yet |

---

## 🚀 Deployment

> The site **auto-deploys** on every push to `main`. No manual steps needed.

### How it works

1. Push a commit to `main` on GitHub
2. GitHub Actions runs `.github/workflows/deploy.yml`
3. Installs dependencies → `npm run build` → publishes `dist/` to `gh-pages` branch
4. Served at `https://Ayushh-Sharmaa.github.io/NexaSphere/`
5. Takes about **1–2 minutes**

### Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### If the site breaks

1. Check the **Actions** tab on GitHub — failed step shown in red
2. Most common cause: syntax error in JSX or missing import
3. Fix and commit — auto-redeploys

---

<div align="center">

Built with ❤️ by the **NexaSphere Core Team**

GL Bajaj Group of Institutions, Mathura

*Proposed by Tanishk Bansal & Ayush Sharma*

</div>
