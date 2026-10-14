# Live Production Test Report — D&D AI Dungeon Master

**Date:** 2026-10-14
**Environment:** Production on Vercel (`lamia6/dnd-ai-dungeon-master`), region `sin1`
**Base URL:** https://dnd-ai-dungeon-master-lamia6.vercel.app (Vercel Authentication protected)
**Deployment:** `jgga6512r` — status **Ready**, target **production**
**Commit:** `43255e4`
**Test method:** Every request executed with `vercel curl` (injects a protection-bypass token). All responses below are verbatim. Raw capture: [`docs/test-evidence/api-tests.txt`](test-evidence/api-tests.txt).

---

## Verdict

The live production app is **functional end-to-end**. All core CRUD, the dice engine, both AI tiers (Prep + Runtime), page routing, and Neon persistence pass. One known limitation remains: the D&D Beyond import happy path could not be exercised because no public test character ID was available.

| Area | Result |
|---|---|
| Health / DB connectivity | PASS |
| Campaigns CRUD + persistence | PASS |
| Characters CRUD + persistence | PASS |
| Sessions CRUD + persistence | PASS |
| Dice engine | PASS |
| Runtime AI — narrate / rules / npc-dialogue / recap | PASS |
| Prep AI — campaign storyline | PASS |
| Page routing (`/`, `/characters`, `/campaigns/[id]`) | PASS |
| D&D Beyond import | KNOWN-LIMIT (bad ID handled; happy path untested) |

---

## Bugs found and fixed during this test

### 1. AI endpoints returned 500 — retired Groq model (FIXED)

Every AI call failed with:

```
{"success":false,"error":"Groq API error: 404 - {\"error\":{\"message\":\"The model `llama-3.1-8b-instant` does not exist or you do not have access to it.\"...}}"}
```

**Root cause:** `vercel.json` had a build-time `env` block pinning `PREP_AI_MODEL` and `RUNTIME_AI_MODEL` to `llama-3.1-8b-instant`, a model Groq has retired. This config-level env **overrode the corrected code default** in `src/lib/ai-service.ts`, which is why an earlier source-only fix did not take effect in production. (Confirmed: no `PREP_AI_MODEL`/`RUNTIME_AI_MODEL` exist as Vercel dashboard env vars — the override came purely from `vercel.json`.)

**Fix:** commit `43255e4` set both to `openai/gpt-oss-120b`, a working Groq model. Redeployed; all AI endpoints now return `success:true` with full content.

### 2. `/characters` and `/campaigns/[id]` returned 404 in production (FIXED earlier this test)

**Root cause:** `.gitignore` used bare patterns `campaigns/` and `characters/`, which matched `src/app/campaigns/` and `src/app/characters/`, so the page files were never committed or deployed.

**Fix:** root-anchored the patterns (`/campaigns/`, `/characters/`) and committed the page files. Both routes now return **HTTP 200**.

---

## Evidence highlights

**Health**
```
GET /api/health
{"status":"healthy","db":"connected","schemaReady":true,"campaignsCount":2,"latencyMs":37}
```

**Runtime AI narration** (trimmed)
```
POST /api/ai/narrate {"action":"narrate", ...}
{"success":true,"data":{"response":"The heavy oak door swings shut behind you with a soft thud ... What will you do?"}}
```
Rules, NPC-dialogue, and recap actions all returned `success:true` with rich, correctly-formatted content.

**Prep AI storyline** (trimmed)
```
POST /api/campaigns/1791948549805-1gel10huy/prepare {"generateStoryline":true}
{"success":true,"data":{...,"preparedMaterials":{"storyline":"**1. Campaign Title** **_The Shattered Crown of Aeloria_** ..."}}}
```

**Persistence** — the campaign created during this test reappears in a fresh `GET /api/campaigns` (count 3), and the new character and session are retrievable by ID, confirming writes land in Neon (not in-memory).

**Dice**
```
POST /api/dice {"action":"roll","notation":"1d20+5"}
{"success":true,"data":{"notation":"1d20+5","rolls":[1],"total":6,"modifier":5,"breakdown":"1 +5"}}
```

---

## Known limitation / follow-ups

1. **D&D Beyond import happy path untested.** A request with a fabricated ID (`123456789`) correctly fails because D&D Beyond returns HTTP 404 for non-existent characters. The happy path needs a real public character ID. *Action:* if you share your own D&D Beyond character URL, I can validate the full import immediately.
2. **Generic error on failed import.** The route returns `"Failed to create character"` (HTTP 500) for any import failure, masking the upstream 404. *Suggested:* surface a clearer message like "Character not found on D&D Beyond".
3. **Test data left in Neon.** This test created campaign `1791948549805-1gel10huy` ("Emberfall Test"), character `char-1791948644142-y07iggu2v`, and session `session-1791948606375-21xg73wq5`. Left in place as evidence; can be deleted on request.

---

## Note on screenshots

No browser screenshots are included. In this environment the headless browser surface reports a 0x0 viewport (`take_screenshot` unavailable), so I could not capture genuine page renders. Rather than fabricate images, page routing was verified via real HTTP status codes (200) from `vercel curl`.

---

**Conclusion:** Production passes comprehensive testing including both AI tiers. Cleared to begin **Phase 2** (core DM loop MVP).

---

# Phase 2 Addendum — Core DM Loop (completed same day)

**Commits:** `b62b55a` (backend), `624c008` (UI) — deployed `qpfk9u9pr`, cold-start verified on `fo1myxqcm`.
**Raw evidence:** [`docs/test-evidence/phase2-e2e.txt`](test-evidence/phase2-e2e.txt).

Phase 2's backend and UI already existed and passed live; the work was gap-closing and hardening. Changes made:

1. **Characters linked to campaigns.** `Character` gained an optional `campaignId`, persisted through the pre-existing `campaign_id` column (no migration needed). Added `listCharactersByCampaign` + `GET /api/characters?campaignId=`. The campaign page now shows a **Party roster** panel and feeds the roster into AI-narration context, so narration is character-aware. The Characters import form gained a campaign selector.
2. **End-Session + recap UI.** The campaign page now has an **End Session** button that generates an AI recap from the narrative log (`action:'recap'`) and persists it via `action:'end'`; the recap is viewable in session history.
3. **Session-persisted dice.** `DiceRoller` accepts a `sessionId` and writes each roll into the session's dice log.
4. **D&D Beyond error handling.** A typed `DnDBeyondError` carries the upstream status; a bad ID now returns a clear 404 message instead of a generic 500.

## Phase 2 gate: PASS

A full end-to-end run against the **deployed** URL was captured verbatim:
campaign → linked character → session → narrative persisted → party-aware AI narration → dice persisted → AI recap → end session. Re-fetch confirmed `status:completed`, 2 narrative entries, 1 dice roll, recap and nextSessionHook all stored.

**Cold-start proof:** after `vercel redeploy` (fresh deployment `fo1myxqcm`, Ready), the session, campaign, and party link all survived; health latency rose 37ms → 149ms, confirming a genuine cold lambda. Local `npm run build` compiled cleanly with TypeScript passing.

**Remaining limitation:** the D&D Beyond import *happy path* is still unverified because no real public character URL was available. Bad-ID handling is now correct. If you provide your own D&D Beyond character URL, I can validate the full import immediately.

---

# Phase 3 Addendum — Prep AI (completed same day)

**Commits:** `0a6e994` (backend), `bcfef1e` (UI) — deployed `9zexcczxy` (Ready).
**Raw evidence:** [`docs/test-evidence/phase3-prep.txt`](test-evidence/phase3-prep.txt).

**Bug found and fixed:** Prep AI generation was effectively broken. The prepare route used regex parsers (`extractField`/`extractList`) written for plain `Name:` text, but `gpt-oss-120b` returns markdown, so a live pre-fix test produced an all-default NPC (`Unknown NPC / Human / Commoner`, empty description). 

**Fix (structured JSON output):** `AIConfig` gained `jsonMode`/`maxTokens`/`temperature`; `sendToGroq` now sends Groq `response_format:{type:"json_object"}`. `PrepAI.generateNPC/designEncounter/generateLocation` prompt for a strict JSON schema (with reasoning-model headroom via `maxTokens:4000`). The route replaces the regex parsers with `JSON.parse` + normalization and a fence/prose-tolerant `safeJsonParse` fallback. A new **PrepPanel** component on the campaign page drives storyline/NPC/encounter/location generation from the browser and lists what's stored.

## Phase 3 gate: PASS

Generated one NPC against the deployed URL — all structured fields populated (no defaults):

```
name: Zarael Vex | title: The Veiled Vendor | race: Tiefling | classType: Rogue
alignment: Chaotic Neutral | personalityTraits: ['Cunning','Sarcastic','Secretive']
sampleDialogue: 3 lines | motivations/secrets/description: populated
```

A fresh `GET /api/campaigns?id=…` (page refresh) returned the persisted NPC (`npcs persisted: 1 | first name: Zarael Vex`), satisfying the gate. Encounter ("Sewer Flood Ambush", hard combat, 6 enemies, 900 XP) and location ("The Gutter Maw", 4 features, populated npcsPresent) generation were also verified, and a final fetch confirmed all three material types persist (`npcs:1 | encounters:1 | locations:1`). Local `npm run build` compiled cleanly with TypeScript passing.

**Next:** Phase 4 (proper deployment hardening + post-deploy smoke suite), per the plan.


