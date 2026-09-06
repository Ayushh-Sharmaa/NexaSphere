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

---

# Follow-up pass — hosting-readiness fixes

This pass followed a report of "various issues" preventing the site from
being hosted. This time the real Express server, the built frontend, and
curl were all run live (not just read/traced), which surfaced several
genuine, previously-undetected bugs — the most severe of which explains
why the admin dashboard could never actually log in.

## Root cause: server crashed on every admin login
`server/index.js` called `crypto.randomBytes()` / `crypto.randomUUID()`
without ever importing Node's `crypto` module, so `/api/admin/login`
threw a 500 error on every attempt (confirmed live), and adding a core
team member would have crashed the same way. Fixed with one import line.
This was very likely the actual source of "various issues."

## Admin login didn't reach the server
`auth.js` had a hardcoded shortcut: entering the documented admin
credentials faked a token client-side and skipped the network call
entirely. That token was never registered in the server's session store,
so every subsequent admin API call using it would have failed
authorization anyway. Rewrote `auth.js` to always call
`POST /api/admin/login` for real; the server now accepts either a
username or an email in the same field (`ADMIN_USERNAME` /
`ADMIN_PASSWORD` env vars, defaulting to `admin` / `admin123` for local
dev — **change these before hosting publicly**, see `.env.example`).

## Public forms never reached the backend or database
The Membership and Recruitment forms posted directly to a hardcoded
Google Apps Script URL (a third party's Google account) and separately
wrote to the *submitter's own browser* `localStorage`. The Admin
Dashboard read applications back out of `localStorage` too — meaning an
admin logging in from a different device than the applicant used would
see nothing. Repointed both forms at the real backend
(`/api/forms/membership`, `/api/forms/recruitment`), removed the
client-only "dual write," and kept Google Sheets as an optional
server-side mirror (already supported, env-var gated, non-fatal on
failure).

## No backend storage or admin routes existed for applications at all
`form_submissions` had no `status` column, and there were no
`/api/admin/membership-apps` / `/api/admin/coreteam-apps` routes — despite
the Admin Dashboard UI fully expecting them (list, Accept / Reject /
Blacklist, Delete). Added:
- `status` + `updated_at` columns (`server/supabase-schema.sql` +
  `server/migrations/002_add_form_status.sql`)
- `listFormSubmissions` / `updateFormSubmissionStatus` /
  `deleteFormSubmission`, each with a Supabase path and a JSON-file-store
  fallback path (so applications are reviewable even without Supabase
  configured — useful for a quick demo deployment)
- The actual GET/PUT/DELETE routes for both tabs

**Verified live**, not just read: submitted a real application via curl,
logged in for a real session token, listed it, accepted it, confirmed the
status changed, deleted it, confirmed it was gone. Also verified a bad
`status` value is rejected with 400, and missing/invalid credentials are
rejected with 401.

## Vercel deployment would not have worked at all
`vercel.json` rewrote `/api/(.*)` to itself, relying on Vercel's
filesystem-based serverless function detection — but the only file under
`api/` was an orphaned, independent `api/core-team/apply.cjs` (Sheets-only,
no DB write, no admin visibility). On Vercel specifically, **none of the
Express routes in `server/index.js`** (events, admin, all the applicant
management routes above) would ever have run; almost every `/api/*` call
would 404 except that one endpoint. Also, `server/index.js`'s Vercel
branch was calling `app.listen()`, which is incorrect for a serverless
function.
- Added `api/index.js`, a thin serverless entrypoint that imports and
  re-exports the real Express `app` from `server/index.js`, so there is a
  single source of truth for every route on every hosting platform.
- Fixed the `VERCEL` conditional so the exported app is never `.listen()`'d
  on serverless.
- Removed the orphaned `api/core-team/apply.cjs` (its route is now served
  correctly, with full DB persistence, by the real Express app).
- Updated `vercel.json`'s rewrite to point at `/api/index`.
- Added `express`, `cors`, `dotenv`, `pg`, `zod` to the **root**
  `package.json` (previously only in `server/package.json`, which Vercel's
  default single-package Node builder won't separately `npm install`).

**Verified live**: imported `api/index.js` using only root `node_modules`
(no `server/node_modules` involved), wrapped it in a raw Node HTTP server,
and confirmed a real request returns the correct response — simulating
what Vercel's runtime does. Also re-confirmed the traditional
`node server/index.js` standalone path still works unchanged.

## Other fixes
- `admin/services/api.js` and `admin/services/auth.js` defaulted to
  `http://localhost:8080`; the server actually runs on `8787`. Both now
  default to same-origin (empty base, relative `/api/...` calls), which is
  correct behind Vercel rewrites or any reverse proxy, with `VITE_API_BASE`
  as an explicit override for a split-origin deployment.
- Added a root `.env.example` documenting every environment variable a
  host needs (admin credentials, CORS origin, Supabase or Postgres,
  optional Google Sheets mirror), with safe defaults noted.

## What's still recommended before going live
- Change `ADMIN_PASSWORD` from the default before hosting publicly.
- Decide on one persistence backend for production (Supabase is the
  simplest given `server/index.js` is the active stack) and run
  `server/supabase-schema.sql` once, or apply the two migration files in
  order against an existing database.
- The file-store fallback (`server/data/content.json`) is fine for a demo
  but will reset on every redeploy on most serverless hosts — don't rely
  on it for real applicant data in production.

