-- =============================================================
-- D&D AI Dungeon Master — Phase 0 schema
-- Target: Neon (serverless Postgres)
--
-- Design notes (see docs/PLAN.md):
--   * Every table carries a NULLABLE owner_id so the same schema
--     works for the solo MVP today and multiplayer + RLS later
--     (Phase 5). We do NOT enable Row-Level Security yet.
--   * Nested / variable-shape data (ability scores, skills,
--     prepared materials, narrative metadata) is stored as JSONB
--     to mirror the TypeScript types without an ORM migration tax.
--   * session_entries is an APPEND-ONLY log covering both dice
--     rolls and narrative beats for a session, ordered by seq.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- campaigns
-- -------------------------------------------------------------
create table if not exists public.campaigns (
  id            text primary key,
  owner_id      text,                       -- nullable: solo now, auth later
  name          text not null,
  description   text not null default '',
  theme         text not null default '',
  level_range   jsonb not null default '{"min":1,"max":1}'::jsonb,
  tone          text not null default 'casual',
  status        text not null default 'planning',
  prepared_materials jsonb,                 -- PrepAI output (storyline, arcs, npcs, ...)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists campaigns_owner_idx on public.campaigns (owner_id);
create index if not exists campaigns_created_idx on public.campaigns (created_at desc);

-- -------------------------------------------------------------
-- characters
-- -------------------------------------------------------------
create table if not exists public.characters (
  id               text primary key,
  owner_id         text,                    -- nullable
  campaign_id      text references public.campaigns(id) on delete set null,
  player_id        text not null default '',
  name             text not null,
  dndbeyond_id     text,                    -- D&D Beyond character id
  dndbeyond_url    text,
  race             text not null default '',
  class_type       text not null default '',
  level            integer not null default 1,
  ability_scores   jsonb not null default '{}'::jsonb,
  hit_points       jsonb not null default '{"current":0,"maximum":0,"temp":0}'::jsonb,
  armor_class      integer not null default 10,
  speed            integer not null default 30,
  proficiency_bonus integer not null default 2,
  skills           jsonb not null default '{}'::jsonb,
  spells           jsonb,
  backstory        text,
  personality_traits jsonb,
  inventory        jsonb not null default '[]'::jsonb,
  notes            text not null default '',
  last_updated     timestamptz not null default now()
);

create index if not exists characters_owner_idx on public.characters (owner_id);
create index if not exists characters_campaign_idx on public.characters (campaign_id);

-- -------------------------------------------------------------
-- sessions
-- -------------------------------------------------------------
create table if not exists public.sessions (
  id             text primary key,
  owner_id       text,                      -- nullable
  campaign_id    text not null references public.campaigns(id) on delete cascade,
  session_number integer not null default 1,
  title          text not null default '',
  date           timestamptz not null default now(),
  duration       integer,                   -- minutes
  status         text not null default 'planned',
  combat_log     jsonb,                     -- optional structured combat rounds
  recap          text,
  next_session_hook text,
  created_at     timestamptz not null default now()
);

create index if not exists sessions_owner_idx on public.sessions (owner_id);
create index if not exists sessions_campaign_idx on public.sessions (campaign_id);

-- -------------------------------------------------------------
-- session_entries  (append-only log: dice + narrative)
-- -------------------------------------------------------------
create table if not exists public.session_entries (
  id          bigint generated always as identity primary key,
  session_id  text not null references public.sessions(id) on delete cascade,
  seq         integer not null,             -- ordering within a session
  entry_type  text not null,                -- 'narration' | 'dialogue' | 'action' | 'description' | 'dice'
  speaker     text,
  content     text not null default '',
  payload     jsonb,                        -- dice roll breakdown, narrative metadata, etc.
  created_at  timestamptz not null default now(),
  unique (session_id, seq)
);

create index if not exists session_entries_session_idx on public.session_entries (session_id, seq);
