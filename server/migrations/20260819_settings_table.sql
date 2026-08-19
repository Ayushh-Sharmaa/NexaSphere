-- NexaSphere — Settings table for admin-controlled feature flags
-- Migration: 20260819_settings_table.sql
-- Run in Supabase SQL Editor AFTER 20260818_initial_supabase_production.sql

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT 'null'::jsonb,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings (key);

-- Seed the core_team_recruitment_open flag, defaulting to false (closed).
-- This matches the current business requirement: recruitment is closed by default.
INSERT INTO settings (key, value, description)
VALUES (
  'core_team_recruitment_open',
  'false'::jsonb,
  'Controls whether the Core Team application form accepts new submissions. Toggle via admin dashboard. Default: closed (false).'
)
ON CONFLICT (key) DO NOTHING;

-- Also seed membership_open for forward compatibility
INSERT INTO settings (key, value, description)
VALUES (
  'membership_open',
  'true'::jsonb,
  'Controls whether the Membership application form accepts new submissions. Default: open (true).'
)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (after the RLS migration has been applied, this table is included)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read — any client can read settings to decide what to show in the UI
CREATE POLICY "settings: public read"
  ON settings FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE for browser roles.
-- All setting mutations go through the backend service-role API endpoint:
--   PATCH /api/v1/admin/settings/:key  (requireClerkAuth + requireRole admin/super_admin)
