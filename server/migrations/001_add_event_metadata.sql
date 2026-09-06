-- Migration: add extended event-engine metadata column.
-- Safe to run multiple times; safe on databases that already have the column
-- (e.g. freshly created from the updated supabase-schema.sql).
--
-- Run with: psql "$DATABASE_URL" -f server/migrations/001_add_event_metadata.sql

alter table if exists events
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists activity_events
  add column if not exists metadata jsonb not null default '{}'::jsonb;
