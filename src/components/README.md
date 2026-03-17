# 🧩 src/components/

All React UI components. Each file is a self-contained building block.

> **Rule:** Components are for UI only. Never hardcode content here — all data goes in `src/data/`.

---

## Component Map

### Layout & Navigation

| File | Renders | Edit when |
|---|---|---|
| `Navbar.jsx` | Fixed top bar — desktop tabs + mobile 2-row layout | Adding/removing nav tabs, logo sizing |
| `Footer.jsx` | Bottom footer with logos and copyright | Changing copyright text |
| `ParticleBackground.jsx` | Full-screen canvas particle field with connecting lines | Adjusting particle count, speed, colors |

### Main Page Sections

| File | Renders | Edit when |
|---|---|---|
| `HeroSection.jsx` | Full-screen landing — logo orbit rings, letter-drop title, data streams, scan line, stats bar | Changing title, tagline, buttons, stats numbers |
| `ActivitiesSection.jsx` | 7 clickable activity cards — each navigates to its detail page | Card layout, hover effects, section heading |
| `EventsSection.jsx` | Timeline of events on the main page | Timeline layout, dot styles, section heading |
| `AboutSection.jsx` | About text + values card + social buttons | About paragraphs, values list, button links |
| `TeamSection.jsx` | Grid of team cards — triggers modal on click | Grid layout, number of columns |

### Team Modal

| File | Renders | Edit when |
|---|---|---|
| `TeamMemberCard.jsx` | Individual card with 3D tilt + shimmer + click animation | Card size, photo size, click hint text |
| `TeamMemberModal.jsx` | Full profile popup — photo, info, social copy buttons | Modal layout, adding new social button types |

> `TeamMemberModal` uses React `createPortal()` — renders directly into `document.body` to avoid clipping by parent containers.

### Sub-Pages (not in navbar — opened by clicking cards)

| File | Renders | Edit when |
|---|---|---|
| `ActivityDetailPage.jsx` | Detail page for any activity — lists conducted + upcoming events | Visual layout only — content comes from `src/data/activities/` |
| `EventDetailPage.jsx` | Full event page — overview, topics, team roles, acknowledgements, media, hashtags | Visual layout only — content comes from activity data files |

---

## Adding a New Component

1. Create `src/components/YourComponent.jsx`
2. Import it in `App.jsx` or the parent component
3. Keep all data/content in `src/data/` — pass it as props
