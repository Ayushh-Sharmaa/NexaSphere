create extension if not exists pgcrypto;

create table if not exists events (
  id text primary key,
  name text not null,
  short_name text,
  date_text text not null,
  description text not null,
  status text not null default 'upcoming',
  icon text default '📌',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_events (
  id text primary key,
  activity_key text not null,
  name text not null,
  date_text text not null,
  tagline text,
  description text not null,
  status text not null default 'completed',
  created_by_name text,
  created_by_email text,
  created_by_phone text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_key_created on activity_events (activity_key, created_at desc);

create table if not exists core_team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  year text not null,
  branch text not null,
  section text not null,
  email text not null,
  whatsapp text not null,
  linkedin text,
  instagram text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  full_name text,
  college_email text,
  whatsapp text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
