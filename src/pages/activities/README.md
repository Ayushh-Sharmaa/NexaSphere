# 🎨 src/pages/activities/

Activity pages — each domain's detail page with conducted and upcoming events.

---

## Files

| File                     | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `ActivitiesPage.jsx`     | Grid of all activity cards with navigation to detail pages      |
| `ActivityDetailPage.jsx` | Full detail page for one activity — conducted + upcoming events |

---

## How Activity Pages Work

1. `ActivitiesPage` shows a card grid from `src/data/activitiesData.js`
2. Clicking a card calls `onNavigate('activity', activityKey)`
3. `App.jsx` looks up `activityPages[activityKey]` from `src/data/activities/index.js`
4. `ActivityDetailPage` receives the full activity object and renders it

---

## To Add a New Activity

1. Create `src/data/activities/<name>.js` with the activity object (see `activities/README.md` for schema)
2. Register it in `src/data/activities/index.js`:

   ```js
   import myActivity from './<name>.js';
   export const activityPages = {
     ...existing,
     'My Activity Title': myActivity,
   };
   ```

3. Add a card entry in `src/data/activitiesData.js` with a matching `title`
