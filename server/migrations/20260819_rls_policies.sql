-- NexaSphere — Row Level Security Policies
-- Migration: 20260819_rls_policies.sql
-- Run in Supabase SQL Editor AFTER 20260818_initial_supabase_production.sql
--
-- IMPORTANT: NexaSphere uses Clerk (not Supabase Auth) for identity.
-- The Clerk user ID is read from the JWT 'sub' claim via:
--   current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
-- For this to work, Clerk's JWT template must be configured to include 'sub'
-- (it does by default) and the Supabase project must have Clerk set as a
-- third-party auth provider with the correct JWKS URL in:
--   Supabase Dashboard → Authentication → Providers → Custom JWT
-- VERIFY this by running a test anonymous supabase-js call after applying
-- these policies — see verification notes at the bottom of this file.
--
-- Service-role key (supabaseAdmin in server/config/supabase.js) bypasses
-- ALL RLS policies. Backend mutations (status changes, audit logs, etc.)
-- must always go through supabaseAdmin, never through the anon/auth client.

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: reusable inline expression for the current Clerk user's ID
-- Use this in policy USING/WITH CHECK expressions:
--   (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
-- ────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Enable RLS on all 15 production tables
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities                ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_join_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_requests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;

-- Also enable on settings table (created by 20260819_settings_table.sql)
-- Run this line only after that migration has been applied:
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Drop any pre-existing policies before recreating (idempotent re-run)
-- ══════════════════════════════════════════════════════════════════════════════

DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','activity_categories','activities','applications',
        'application_status_history','events','event_registrations',
        'teams','team_members','team_join_requests','team_invitations',
        'mentors','fund_requests','notifications','audit_logs','settings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: profiles
-- A user can read/update only their own profile row.
-- INSERT is handled exclusively by the backend (POST /api/v1/auth/sync),
-- which runs under supabaseAdmin (service-role), bypassing RLS.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "profiles: owner can select own row"
  ON profiles FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "profiles: owner can update own row"
  ON profiles FOR UPDATE
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )
  WITH CHECK (
    -- Prevent the user from changing their own clerk_user_id or email
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No INSERT policy for anon/auth role — profile creation is service-role only.
-- No DELETE policy — profiles are never deleted by the browser.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: activity_categories
-- Public read-only catalogue. No browser writes.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "activity_categories: public read"
  ON activity_categories FOR SELECT
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE for anon or authenticated roles.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: activities
-- Public can read published activities. No browser writes.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "activities: public read published"
  ON activities FOR SELECT
  USING (status = 'published');

-- No INSERT/UPDATE/DELETE for anon or authenticated roles.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: applications
-- A user can read their own applications and submit new ones.
-- Status changes (UPDATE) are blocked entirely for browser roles —
-- all transitions go through supabaseAdmin in applicationsService.js.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "applications: owner can select own rows"
  ON applications FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "applications: owner can insert own application"
  ON applications FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No UPDATE policy for authenticated role.
-- Status transitions are service-role only (supabaseAdmin in applicationsService.js).
-- No DELETE policy.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: application_status_history
-- Fully internal audit trail. Service-role only. No browser access at all.
-- ══════════════════════════════════════════════════════════════════════════════

-- No policies created → all browser access denied by RLS.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: events
-- Public read. No browser writes (events are admin-managed).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "events: public read"
  ON events FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE for anon or authenticated roles.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: event_registrations
-- A signed-in user can read their own registrations and register themselves.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "event_registrations: owner can select own rows"
  ON event_registrations FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "event_registrations: owner can insert own registration"
  ON event_registrations FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No UPDATE. No DELETE (cancellations go through service-role).


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: teams
-- Members of a team can read it; the leader can update it.
-- Anyone authenticated can create a team (they become the leader).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "teams: member can select their teams"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id
        AND tm.clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
    OR
    leader_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "teams: authenticated can create team"
  ON teams FOR INSERT
  WITH CHECK (
    leader_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') IS NOT NULL
  );

CREATE POLICY "teams: leader can update team"
  ON teams FOR UPDATE
  USING (
    leader_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )
  WITH CHECK (
    leader_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No DELETE policy (team dissolution is service-role only).


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: team_members
-- A user can see members of teams they belong to; they can join/leave.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "team_members: member can select their team rows"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
  );

CREATE POLICY "team_members: user can insert own membership"
  ON team_members FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "team_members: user can delete own membership"
  ON team_members FOR DELETE
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: team_join_requests
-- Requester can read their own requests.
-- Team leader can read requests to their team and update status.
-- Anyone authenticated can insert a request for themselves.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "team_join_requests: requester or leader can select"
  ON team_join_requests FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    OR
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_join_requests.team_id
        AND t.leader_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
  );

CREATE POLICY "team_join_requests: requester can insert own request"
  ON team_join_requests FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "team_join_requests: leader can update request status"
  ON team_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_join_requests.team_id
        AND t.leader_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: team_invitations
-- Invited user can read invitations addressed to them and accept/reject.
-- INSERT (sending invitations) is service-role only (team leader action via API).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "team_invitations: invited user can select own invitations"
  ON team_invitations FOR SELECT
  USING (
    invited_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "team_invitations: invited user can update own invitation"
  ON team_invitations FOR UPDATE
  USING (
    invited_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )
  WITH CHECK (
    invited_clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No INSERT for authenticated role — invitation sending is backend-only.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: mentors
-- Public read of active mentors. No browser writes.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "mentors: public read active mentors"
  ON mentors FOR SELECT
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE for browser roles.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: fund_requests
-- A user can read, submit, and update (edit) their own fund requests.
-- Final status changes (approved/disbursed) are service-role only.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "fund_requests: owner can select own rows"
  ON fund_requests FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "fund_requests: owner can insert own request"
  ON fund_requests FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "fund_requests: owner can update own pending request"
  ON fund_requests FOR UPDATE
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    AND status = 'pending'
  )
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No DELETE. No UPDATE once status moves past 'pending' (admin action via service-role).


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: notifications
-- A user can read their own notifications and mark them as read (update read_at).
-- INSERT is service-role only (notifications are system-generated).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "notifications: owner can select own notifications"
  ON notifications FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

CREATE POLICY "notifications: owner can update own read_at"
  ON notifications FOR UPDATE
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- No INSERT for authenticated role — notifications are backend-generated only.
-- No DELETE for authenticated role.


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: audit_logs
-- Fully internal. Service-role only. No browser access at all.
-- ══════════════════════════════════════════════════════════════════════════════

-- No policies created → all browser access denied by RLS.


-- ══════════════════════════════════════════════════════════════════════════════
-- SETTINGS TABLE (apply after 20260819_settings_table.sql has been run)
-- Uncomment and run this block after that migration:
-- ══════════════════════════════════════════════════════════════════════════════
--
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "settings: public read"
--   ON settings FOR SELECT
--   USING (true);
--
-- No INSERT/UPDATE/DELETE for browser roles — settings are admin-managed via service-role API.


-- ══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION CHECKLIST (run manually after applying this migration)
-- ══════════════════════════════════════════════════════════════════════════════
--
-- 1. ANONYMOUS REJECTION TEST (should return 0 rows / error):
--    Using supabase-js with anonKey (no auth):
--      const { data, error } = await supabase.from('profiles').select('*')
--    Expected: data = [], or RLS error. If you see rows → JWT claim path is wrong.
--
-- 2. CROSS-USER ISOLATION TEST:
--    Sign in as User A, get their Clerk token, use it to query:
--      supabase.auth.setSession({ access_token: clerkToken })
--      await supabase.from('profiles').select('*')
--    Should return only User A's own row, not User B's.
--
-- 3. STATUS UPDATE BLOCK TEST:
--    As an authenticated user, attempt:
--      await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId)
--    Expected: 0 rows updated (no UPDATE policy exists for auth role).
--
-- 4. AUDIT LOG BLOCK:
--    As any role:
--      await supabase.from('audit_logs').select('*')
--    Expected: 0 rows (no SELECT policy).
--
-- NOTE: If Clerk JWT is not being forwarded to Supabase properly, ALL authenticated
-- policies will fail silently (returning 0 rows instead of the user's own data).
-- Configure Clerk → Supabase JWT integration:
--   Clerk Dashboard → JWT Templates → Create "supabase" template
--   Set JWKS endpoint in Supabase → Auth Settings → JWT Secret (use RS256)
--   Or use the simpler HS256 shared secret approach with SUPABASE_JWT_SECRET.
