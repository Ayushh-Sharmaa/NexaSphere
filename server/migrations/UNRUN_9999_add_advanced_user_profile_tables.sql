-- Advanced User Profile (Skills, Contributions, Endorsements, Privacy, Summary)
-- Thin vertical slice groundwork. Designed to be safe to run multiple times.

CREATE TABLE IF NOT EXISTS user_skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  category VARCHAR(64) NOT NULL,
  skill_key VARCHAR(128) NOT NULL,
  self_level INT NOT NULL DEFAULT 1,
  computed_level INT NOT NULL DEFAULT 1,
  quiz_score INT NULL,
  endorsement_score INT NOT NULL DEFAULT 0,
  event_attendance_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, skill_key)
);

CREATE TABLE IF NOT EXISTS skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_user_id INT NOT NULL,
  mentee_user_id INT NOT NULL,
  category VARCHAR(64) NOT NULL,
  skill_key VARCHAR(128) NOT NULL,
  is_mentor_endorsement BOOLEAN NOT NULL DEFAULT FALSE,
  weight INT NOT NULL DEFAULT 1,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generic contribution log to power heatmaps/timeline.
-- event_type examples: event_attended, content_created, feedback_given, mentoring_hours
CREATE TABLE IF NOT EXISTS user_contribution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  occurred_at DATE NOT NULL,
  occurred_at_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profile_privacy_prefs (
  user_id INT PRIMARY KEY,
  visibility_skills VARCHAR(16) NOT NULL DEFAULT 'public', -- public|club|private
  visibility_contributions VARCHAR(16) NOT NULL DEFAULT 'public',
  visibility_endorsements VARCHAR(16) NOT NULL DEFAULT 'public',
  anonymous_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Editable summary + last generated snapshot
CREATE TABLE IF NOT EXISTS user_professional_summaries (
  user_id INT PRIMARY KEY,
  generated_text TEXT NOT NULL DEFAULT '',
  user_edited_text TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_generated_at TIMESTAMPTZ NULL
);

-- Year/peer aggregations can be computed from the logs, but keep a lightweight cache table.
CREATE TABLE IF NOT EXISTS user_skill_peer_aggregates_cache (
  category VARCHAR(64) NOT NULL,
  skill_key VARCHAR(128) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_level NUMERIC(10,2) NOT NULL,
  participants INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (category, skill_key, period_start, period_end)
);

