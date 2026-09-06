-- Migration: add applicant-status tracking to form_submissions, needed for
-- the Admin Dashboard's Accept/Reject/Blacklist applicant management.
-- Safe to run multiple times.
--
-- Run with: psql "$DATABASE_URL_OR_SUPABASE" -f server/migrations/002_add_form_status.sql

alter table if exists form_submissions
  add column if not exists status text not null default 'pending';

alter table if exists form_submissions
  add column if not exists updated_at timestamptz not null default now();

create index if not exists form_submissions_type_idx on form_submissions (form_type);
create index if not exists form_submissions_status_idx on form_submissions (status);
