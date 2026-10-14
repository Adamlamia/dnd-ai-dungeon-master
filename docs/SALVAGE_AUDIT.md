# Phase 1 — Salvage Audit

Date: 2026-10-14
Scope: decide what to keep vs rewrite when moving the data layer from
in-memory `Map` storage to Neon serverless Postgres.

## Verdict summary

| Module | Decision | Why |
|---|---|---|
| `src/lib/dice.ts` | **KEEP** | Pure functions, no I/O, already verified working in prod (`POST /api/dice`). |
| `src/lib/dndbeyond.ts` | **KEEP** | Isolated fetch + mapping of the D&D Beyond character API. No storage coupling. |
| `src/lib/ai-service.ts` | **KEEP** | Groq-backed Prep/Runtime AI. Env-driven provider selection already fixed. |
| `src/types/index.ts` | **KEEP** | Domain types are the contract the schema mirrors. Unchanged. |
| `src/lib/storage.ts` | **REWRITE** | Was in-memory `Map` — lost all data on cold start. Now Neon-backed, same exported interface. |
| `src/services/campaignService.ts` | **KEEP (unchanged)** | Thin wrapper over `campaignStorage`. Interface preserved → no edits needed. |
| `src/services/characterService.ts` | **KEEP (unchanged)** | Thin wrapper over `characterStorage`. |
| `src/services/sessionService.ts` | **KEEP (unchanged)** | Thin wrapper over `sessionStorage`. |
| `src/app/api/**` routes | **KEEP (unchanged)** | Call the services, which call storage. The rewrite is invisible above the storage seam. |
| Prisma deps | **REMOVED** | `@prisma/client` + `prisma` were stale, caused install failures, unused. |

## Key design decision: rewrite at the storage seam

The services only ever touch `campaignStorage` / `characterStorage` /
`sessionStorage`. By rewriting `storage.ts` to keep the **exact same method
signatures** (`save`, `get`, `getAll`, `delete`, and `sessionStorage.getByCampaignId`),
the entire layer above it — services, API routes, UI — continues to work with
zero changes. This minimizes blast radius and review surface.

## Type ↔ table mapping

- `Campaign.levelRange` → `campaigns.level_range` (jsonb)
- `Campaign.preparedMaterials` → `campaigns.prepared_materials` (jsonb, nullable)
- `Character.abilityScores/hitPoints/skills/spells/personalityTraits/inventory`
  → jsonb columns on `characters`
- `Character` has **no** `campaignId` field → `characters.campaign_id` stays NULL
- `Session.narrativeLog[]` / `Session.diceRolls[]` → `sessions.narrative_log` /
  `sessions.dice_rolls` (jsonb) added in migration `0002_session_logs.sql`
- Timestamps written as ISO strings cast `::timestamptz`; read back as JS `Date`
  so domain objects match the existing types.

## Append-only `session_entries` — deferred to Phase 2

`0001_init.sql` created `session_entries` for granular, streaming live-session
logging. Phase 1 does **not** write to it: the existing storage interface saves
the whole `Session` object at once, which maps cleanly to JSONB columns on the
row. Phase 2's live runner will append individual dice/narrative beats to
`session_entries` and can assemble the Session log from there. This is a
deliberate, documented redundancy to de-risk Phase 1.

## owner_id / multiplayer

Every insert writes `owner_id = NULL` for the solo MVP. The column exists on all
tables so Phase 5 (auth + Row-Level Security) can populate it without another
schema migration.

## Verification plan (gate for Phase 1)

1. `tsc --noEmit` → 0 errors. ✅ (done)
2. `next build` → exit 0.
3. Apply `0002_session_logs.sql` to Neon.
4. Deploy, then prove **persistence across a cold start** with raw curl:
   - `POST /api/campaigns` → 201, capture `id`
   - `GET /api/campaigns` → the campaign is present
   - Force a new instance (redeploy / wait for scale-to-zero) → `GET` again →
     campaign STILL present (this is what in-memory storage could never do)
   - Same round-trip for a session and a character.
