-- =============================================================
-- D&D AI Dungeon Master — Phase 1 schema addendum
-- Target: Neon (serverless Postgres)
--
-- The domain Session object carries narrativeLog[] and diceRolls[]
-- inline, and the existing storage interface saves/gets the whole
-- object. To round-trip that losslessly with minimal risk, we store
-- those two logs as JSONB on the sessions row.
--
-- The append-only session_entries table (0001) remains reserved for
-- Phase 2's granular live-session logging (streaming individual dice
-- rolls / narrative beats). Phase 1 uses the JSONB columns as the
-- source of truth for the assembled Session object.
-- =============================================================

alter table public.sessions
  add column if not exists narrative_log jsonb not null default '[]'::jsonb;

alter table public.sessions
  add column if not exists dice_rolls jsonb not null default '[]'::jsonb;
