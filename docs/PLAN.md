# D&D AI Dungeon Master — Rebuild Plan (v2)

> Status: DRAFT — awaiting sign-off before any development begins.
> Date: 2026-10-12

## Why we're re-planning

The first build shipped feature code that works (dice engine, D&D Beyond
parser, two-AI service, API routes all respond correctly) but was built on a
rushed foundation:

- **No durable storage.** Campaigns/characters/sessions lived in in-memory
  `Map` objects (`src/lib/storage.ts`). On Vercel serverless these are wiped on
  every cold start, redeploy, or region change. A campaign you build over weeks
  would vanish.
- **No verification discipline.** A "test passed / 92%" report was accepted
  without raw evidence. That is how the storage gap went unnoticed.

Decisions locked with the user:

1. **Salvage + rebuild foundation** — keep working feature code, redo storage,
   deployment, and verification.
2. **Solo now, multiplayer later** — no login today, but the data model must
   support accounts/ownership without a rewrite.
3. **Actually play D&D soon** — cut scope hard; ship the minimum that runs a
   real session this week.

## Goal of v2

A single DM can: create a campaign, add/import characters, start a session,
roll dice and get AI narration during play, and end the session with a saved
recap — and all of it **survives a page refresh and a redeploy**.

---

## Foundational decision: storage

**Recommendation: Supabase (managed Postgres).**

Why:
- Free tier is ample for a solo DM.
- Serverless-friendly (works on Vercel without the Prisma install failures we
  hit before — uses `@supabase/supabase-js`, a plain HTTP/WebSocket client).
- Ships with **Auth + Row-Level Security**, which is exactly the
  "multiplayer later" path. We add `owner_id` columns now (nullable) and turn
  on auth later — no schema rewrite.

Alternative if you prefer to stay minimal: **Neon Postgres + Drizzle ORM**.
Also free and serverless, but auth becomes a separate later project.

> This is the one decision worth confirming before I start, since everything
> else depends on it.

### Data model (multiplayer-ready from day one)

Every user-owned table gets an `owner_id` (text, nullable now, populated once
auth exists). Nested/variable data uses JSONB so we don't over-normalize.

- `campaigns` — id, owner_id, name, description, theme, tone, level_range
  (jsonb), status, prepared_materials (jsonb), timestamps
- `characters` — id, owner_id, campaign_id (nullable), name, player_id,
  dndbeyond_id/url, race, class, level, ability_scores (jsonb), hit_points
  (jsonb), armor_class, speed, proficiency_bonus, skills (jsonb), spells
  (jsonb), backstory, personality (jsonb), inventory (jsonb), notes, timestamps
- `sessions` — id, owner_id, campaign_id, session_number, title, date,
  duration, status, recap, next_session_hook, timestamps
- `session_entries` — id, session_id, owner_id, type
  (narration/dialogue/action/dice/combat), payload (jsonb), created_at
  (append-only log; dice rolls and narrative both land here)

---

## Phases (each ends with a real verification gate)

### Phase 0 — Foundation & guardrails
- Create Supabase project; store connection keys as Vercel env vars.
- Write schema + initial migration.
- Add startup env-var validation (fail fast with a clear message if missing).
- **Establish the verification protocol** (see bottom). This is a deliverable,
  not an afterthought.

Gate: a `/api/health` endpoint returns DB connectivity status; verified with
raw `curl` output pasted into the record.

### Phase 1 — Salvage audit
- Inventory every existing file → mark **keep / fix / discard**.
- Expected keep as-is: `src/lib/dice.ts`, `src/lib/dndbeyond.ts`,
  `src/lib/ai-service.ts`, `src/types/index.ts`, UI components.
- Expected rewrite: `src/lib/storage.ts` → Supabase client; all three services
  → real DB queries.

Gate: written audit table committed to `docs/SALVAGE_AUDIT.md`.

### Phase 2 — Core DM loop (the "play this week" MVP)
- Campaign CRUD on Postgres.
- Characters: manual creation **+** D&D Beyond import.
- Sessions: create → dice rolls persisted → narrative log persisted → AI
  narration via Groq → end with recap.

Gate: full end-to-end run against the **deployed** URL with captured evidence
(see verification protocol). Data must survive a manual cold start.

### Phase 3 — Prep AI (secondary; only after Phase 2 is solid)
- NPC / encounter / location generation, saved into `campaigns.prepared_materials`.

Gate: generate one NPC and confirm it persists and reappears after refresh.

### Phase 4 — Proper deployment
- Env vars set in Vercel (no secrets ever committed — GitHub push protection
  already caught one leaked key earlier).
- Production build clean; post-deploy smoke suite run against the live URL.

Gate: smoke suite green with raw output recorded.

### Phase 5 — (Future, out of scope now) Multiplayer
- Enable Supabase Auth, backfill `owner_id`, add Row-Level Security policies.

---

## Verification protocol (non-negotiable this time)

Every phase gate must produce **raw, reproducible evidence**, not a narrative:

1. `curl -w "\nHTTP_STATUS:%{http_code}\n"` against the live endpoint, output
   pasted verbatim.
2. For persistence claims: create → cold-start (or wait) → re-fetch and show
   the record still exists.
3. Browser checks via real tool calls with actual captured responses.
4. **No subagent-written "PASS/score" report is accepted as proof.** A
   subagent may run tests, but the raw output must be shown.

## Scope explicitly cut for v2

- User accounts / login (Phase 5).
- Multi-player shared sessions.
- Combat tracker UI (data model supports it via `session_entries`; UI deferred).
- Voice integration.
- Migration off JSONB into fully normalized tables.

## Open question for you

Confirm the storage choice (Supabase recommended) and I'll begin with Phase 0.
