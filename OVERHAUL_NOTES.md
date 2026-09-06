# Overhaul Notes — Routing, Admin Merge & Event Engine

This pass implements the remaining gaps against `IMPLEMENTATION_PLAN.md`:
icon modernization and applicant management (Accept/Reject/Blacklist/CSV
export) were already complete in the repo; this pass adds real URL routing,
merges the admin dashboard into the main app, and expands the event
creation engine.

## 1. Real URL routing
- Added `react-router-dom`; `src/main.jsx` now wraps `<App/>` in a
  `<BrowserRouter>`.
- `src/App.jsx` was rewritten to drive navigation off
  `useNavigate`/`useLocation`/`useParams` instead of internal React state.
  Routes: `/`, `/home`, `/activities`, `/activities/:activityKey`,
  `/events`, `/events/:eventId`, `/about`, `/team`, `/contact`,
  `/membership`, `/recruitment`, `/admin/*`.
- The existing page-wipe transition and all visual/motion effects are
  preserved; only the navigation *mechanism* changed.
- `vercel.json` / `netlify.toml` already had correct SPA rewrite rules for
  this — no changes needed there.

## 2. Admin dashboard merged into the main app
- The previously separate `admin-dashboard/` app is now also mounted at
  `/admin/*` inside the main site (`src/pages/admin/AdminApp.jsx`), so the
  main app's `/admin` route is a real, working dashboard instead of a
  link-out stub. `admin-dashboard/` is left in place as an optional
  standalone deployment; nothing was deleted.
- All internal `/dashboard` and `/login` paths were updated to
  `/admin` and `/admin/login`.
- **Bug fix**: `ActivityEventsManager`'s activity keys were kebab-case
  (`hackathon`, `insight-session`) while the rest of the app uses
  title-case (`Hackathon`, `Insight Session`) — this silently broke
  activity-event lookups. Fixed, plus added proper URL-encoding for keys
  containing spaces.

## 3. Advanced Admin Event Creation Engine
- Added an additive `metadata jsonb` column to `events` and
  `activity_events` (see `server/supabase-schema.sql` and the new
  `server/migrations/001_add_event_metadata.sql` for existing databases).
- New fields (all optional, namespaced under `metadata`): category,
  topic, overview, presenter (name/title), judges, topics covered,
  highlights, faculty in-charge (name/department), photos/videos drive
  links, time, venue.
- `EventForm.jsx` and `ActivityEventForm.jsx` were rebuilt with these
  fields. **Bug fix**: both forms previously sent field names
  (`dateText`, `location`, flat `topic`/`presenter`) that didn't match
  what the backend actually accepted — forms now match the real API
  contract.
- `EventDetailPage.jsx` now maps `event.metadata` onto the page's existing
  curated-content fields (topics, presenters, acknowledgements, media
  links) as a fallback, so admin-created events render through the same
  polished UI as hand-authored ones, without changing behavior for
  existing curated events.

## Architecture note (pre-existing, not introduced by this pass)
The server has two parallel implementations: `server/routes/api.js` (+
controllers/services/repositories/validators, Postgres/Zod) and
`server/index.js` (inline Supabase-or-file-store logic). Only
`server/index.js` is actually mounted as the app entrypoint per
`server/package.json`; `routes/api.js` was imported but never used. Both
stacks were updated for the new `metadata` field for consistency, but this
duplication predates this change and may be worth consolidating later.

## Remaining emoji sweep
Two stray literal 📅 characters (outside the icon-alias system checked
previously) were found in `ActivityDetailPage.jsx` and replaced with
`DynamicIcon name="Calendar"`. A full-repo scan now confirms zero emoji
remain in `src/`.

## Verification performed
- `npm run build` — 0 errors, clean single-`index.html` SPA output.
- Manual trace of every `nav()`/`onTab()` call site against the defined
  `<Route>` list.
- Manual trace of the metadata field from admin form → API →
  repository/store → public detail page.
- Could not run a live browser or Postgres instance in this environment,
  so end-to-end click-through and live DB writes were not verified against
  a running server — recommend a manual smoke test per the plan's
  "Functional Verification" checklist before deploying.
