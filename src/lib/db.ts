/**
 * Neon (serverless Postgres) client + environment validation — Phase 0
 *
 * We use Neon's HTTP driver (`neon()`), which is the recommended approach on
 * Vercel serverless: each query is a stateless HTTP request, so there are no
 * connection-pool limits to manage and it works in both Node and Edge runtimes.
 *
 * Env var required:
 *   DATABASE_URL — the Neon pooled connection string.
 *   When provisioned via the Vercel Marketplace this is injected automatically
 *   (often as DATABASE_URL / DATABASE_URL_UNPOOLED / PGHOST etc.). We only need
 *   a single DATABASE_URL.
 *
 * Security: DATABASE_URL is a secret. It lives only in .env.local (gitignored)
 * and Vercel env vars — never committed, never sent to the browser.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export interface EnvStatus {
  ok: boolean;
  missing: string[];
}

const REQUIRED_ENV = ['DATABASE_URL'] as const;

/** Returns which required env vars are missing. Cheap, side-effect free. */
export function validateEnv(): EnvStatus {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  return { ok: missing.length === 0, missing: [...missing] };
}

let sql: NeonQueryFunction<false, false> | null = null;

/**
 * Lazily build a singleton Neon query function.
 * Throws a clear, actionable error if DATABASE_URL is missing so callers can
 * surface a 503 instead of a cryptic driver failure.
 */
export function getDb(): NeonQueryFunction<false, false> {
  if (sql) return sql;

  const { ok, missing } = validateEnv();
  if (!ok) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set DATABASE_URL in .env.local and as a Vercel env var.`
    );
  }

  sql = neon(process.env.DATABASE_URL!);
  return sql;
}
