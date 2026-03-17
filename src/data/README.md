# 📊 src/data/

All website content lives here. **You should only ever need to edit files in this folder** for routine updates — no component code changes required.

---

## Files Overview

| File | Controls | How often edited |
|---|---|---|
| `teamData.js` | All 12 team members — names, roles, photos, social links | When adding/updating members |
| `eventsData.js` | Events timeline on the main Events tab | When adding/updating events |
| `activitiesData.js` | The 7 activity card titles, icons, descriptions | Rarely — only for wording changes |
| `activities/` | Full detail pages for each activity type | When a new event is conducted |

---

## teamData.js

Each member object:

```js
{
  id: 1,                                    // Unique number — never repeat
  name: 'Full Name',
  role: 'Organiser',                        // Shown on card and modal
  year: '1st Year',
  branch: 'CSE (AI & ML)',
  section: 'F',
  photo: memberImg,                         // Import at top of file
  linkedin: 'https://linkedin.com/in/...',  // null = button hidden
  email: 'name@example.com',               // null = button hidden
  whatsapp: '9876543210',                  // Plain number or wa.me URL
  instagram: 'https://instagram.com/...',  // null = button hidden
}
```

---

## eventsData.js

Each event object:

```js
{
  id: 1,
  name: 'KSS — Knowledge Sharing Session',
  shortName: 'KSS',
  date: 'March 14, 2025',
  description: 'Full description shown on timeline card...',
  status: 'completed',   // or 'upcoming'
  icon: '🧠',
  tags: ['Learning', 'Community', 'Tech'],
}
```

---

## activitiesData.js

Each activity card:

```js
{
  id: 1,
  icon: '⚡',
  title: 'Hackathon',      // MUST match key in activities/index.js exactly
  description: 'Card body text...',
}
```

---

## activities/ folder

See `activities/README.md` for the full guide.
