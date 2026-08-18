-- NexaSphere Production Supabase PostgreSQL Schema (v2)
-- Migration: 20260818_initial_supabase_production.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automated updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing tables to establish exact canonical normalized schema
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_join_requests CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS fund_requests CASCADE;
DROP TABLE IF EXISTS application_status_history CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS activity_categories CASCADE;
DROP TABLE IF EXISTS mentors CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Student / User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  college_email TEXT,
  roll_number TEXT,
  branch TEXT,
  section TEXT,
  year TEXT,
  semester TEXT,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_clerk_id ON profiles (clerk_user_id);
CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_roll_number ON profiles (roll_number);

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2. Activity Categories (8 Normalized Canonical Activity Keys)
CREATE TABLE activity_categories (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO activity_categories (key, name, description, icon, color, display_order, is_active)
VALUES
  ('hackathon', 'Hackathon', '24-48 hour collaborative product sprints and builds.', 'Code2', '#CC1111', 1, true),
  ('codathon', 'Codathon', 'Competitive programming, algorithms, and DSA contests.', 'Terminal', '#E53E3E', 2, true),
  ('ideathon', 'Ideathon', 'Product ideation, problem solving, and startup pitches.', 'Lightbulb', '#DD6B20', 3, true),
  ('promptathon', 'Promptathon', 'AI prompting, LLM engineering, and creative AI workflows.', 'Sparkles', '#805AD5', 4, true),
  ('workshop', 'Workshop', 'Hands-on practical technical workshops and masterclasses.', 'Cpu', '#3182CE', 5, true),
  ('insight_session', 'Insight Session', 'Expert talks, industry panels, and tech insights.', 'Users', '#319795', 6, true),
  ('open_source_day', 'Open Source Day', 'Open source contribution drives, Git mastery, and PR sprints.', 'GitPullRequest', '#38A169', 7, true),
  ('tech_debate', 'Tech Debate', 'Structured debates on emerging technologies, AI ethics, and trends.', 'MessageSquare', '#D69E2E', 8, true);

-- 3. Activities
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  activity_type TEXT NOT NULL REFERENCES activity_categories(key) ON UPDATE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  date_text TEXT,
  starts_at TIMESTAMPTZ,
  location TEXT DEFAULT 'GL Bajaj Campus / Virtual',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_type ON activities (activity_type);
CREATE INDEX idx_activities_status ON activities (status);
CREATE INDEX idx_activities_created ON activities (created_at DESC);

CREATE TRIGGER set_timestamp_activities
BEFORE UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4. Applications (Unified Membership & Core Team recruitment with human-readable application numbers)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  application_type TEXT NOT NULL CHECK (application_type IN ('membership', 'core_team')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'on_hold', 'withdrawn')),
  schema_version INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  hold_reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_apps_one_active_per_user_type
ON applications (clerk_user_id, application_type)
WHERE status NOT IN ('withdrawn', 'rejected');

CREATE INDEX idx_applications_clerk_id ON applications (clerk_user_id);
CREATE INDEX idx_applications_type ON applications (application_type);
CREATE INDEX idx_applications_status ON applications (status);
CREATE INDEX idx_applications_created ON applications (created_at DESC);

CREATE TRIGGER set_timestamp_applications
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5. Application Status History (Detailed State Machine Audit Trail)
CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  status_changed_by TEXT NOT NULL,
  change_reason TEXT,
  notes TEXT,
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_history_app_id ON application_status_history (application_id);
CREATE INDEX idx_app_history_created ON application_status_history (status_changed_at DESC);

-- 6. Events (with starts_at, ends_at, and capacity protection)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  ends_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  date_text TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  icon TEXT DEFAULT '📌',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  capacity INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts_at ON events (starts_at);
CREATE INDEX idx_events_status ON events (status);

CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 7. Event Registrations (Atomic Lock & Clerk Identity)
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, clerk_user_id)
);

CREATE INDEX idx_event_reg_event ON event_registrations (event_id);
CREATE INDEX idx_event_reg_clerk ON event_registrations (clerk_user_id);

-- 8. Teams, Members, Join Requests & Invitations
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  leader_clerk_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  max_members INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, clerk_user_id)
);

CREATE TABLE team_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, clerk_user_id, status)
);

CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_clerk_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Mentors
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT REFERENCES profiles(clerk_user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT,
  expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Student / Team Fund Requests (Supporting Supabase Document Storage)
CREATE TABLE fund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_requested NUMERIC(10, 2) NOT NULL,
  purpose TEXT NOT NULL,
  document_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'disbursed')),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_timestamp_fund_requests
BEFORE UPDATE ON fund_requests
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 11. Notifications (With read_at & expiration)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES profiles(clerk_user_id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_clerk ON notifications (clerk_user_id, read_at, created_at DESC);

-- 12. Audit Logs (Comprehensive Administrative Mutation Logging)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
