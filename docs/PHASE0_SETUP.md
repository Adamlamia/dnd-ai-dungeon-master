# Phase 0 — Neon Postgres Setup Runbook

Storage backend: **Neon serverless Postgres** (chosen over Supabase — see
docs/PLAN.md). There is no Neon-provisioning MCP tool wired to your account
here, so creating the database needs ~2 minutes from you. Everything after
(migration, health check, Phase 1+) I drive myself.

## Fastest path — provision via Vercel Marketplace (auto-injects env vars)
1. Open your Vercel project → **Storage** tab → **Create Database**.
2. Choose **Neon** (Serverless Postgres). Accept the defaults, pick a region
   close to you.
3. On the connect step, select **Next.js** and let it **auto-connect** the env
   vars to the project. This sets `DATABASE_URL` (plus a few aliases) on the
   Vercel project automatically — no key copying.
4. Redeploy so the new env vars take effect (any push, or **Deployments →
   Redeploy**).

## Alternative — provision at neon.tech directly
1. https://console.neon.tech → **Create Project**.
2. Copy the **pooled connection string**.
3. Send it to me (chat is fine) OR add it yourself as a Vercel env var named
   `DATABASE_URL` and put it in `.env.local`.

> Security: `DATABASE_URL` is a secret. It lives ONLY in `.env.local`
> (gitignored) and Vercel env vars. Never committed, never sent to the browser.

## Apply the schema
Open the Neon **SQL Editor** and paste the entire contents of
`db/migrations/0001_init.sql`, then Run. It creates 4 tables: `campaigns`,
`characters`, `sessions`, `session_entries`.
(If you provisioned via Vercel Marketplace, you can also reach the SQL editor
from the Neon dashboard link in the Storage tab.)

## What I do once DATABASE_URL is set
1. Confirm it's present as a Vercel production env var.
2. Prove connectivity with a **raw curl** of `/api/health` on the live deploy —
   expecting `{"status":"healthy","db":"connected","schemaReady":true,...}` and
   HTTP 200.
3. Only then mark Phase 0 complete and start Phase 1 (salvage audit).

Per the plan's verification protocol, Phase 0 is **not** done until that raw
curl output is pasted verbatim. Until the schema is applied, `/api/health`
returns 503 `schema_missing` — which is itself useful proof that connectivity
works but the migration hasn't run.
