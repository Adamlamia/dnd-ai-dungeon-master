import { NextResponse } from 'next/server';
import { getDb, validateEnv } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Proves REAL database connectivity, not just "the process is alive".
 *   1. `SELECT 1` — confirms Neon is reachable and credentials are valid.
 *   2. count(campaigns) — confirms the Phase 0 migration has been applied.
 *
 * A raw `curl -w "%{http_code}"` cleanly distinguishes states:
 *   200 healthy | 503 missing_env / db_unreachable / schema_missing
 */
export async function GET() {
  const started = Date.now();

  const env = validateEnv();
  if (!env.ok) {
    return NextResponse.json(
      { status: 'unhealthy', reason: 'missing_env', missing: env.missing },
      { status: 503 }
    );
  }

  try {
    const sql = getDb();

    // 1. Basic connectivity
    const ping = await sql`SELECT 1 AS ok`;
    if (!ping?.[0] || ping[0].ok !== 1) {
      return NextResponse.json(
        { status: 'unhealthy', reason: 'db_unreachable', detail: 'SELECT 1 did not return 1' },
        { status: 503 }
      );
    }

    // 2. Schema presence (migration applied?)
    let campaignsCount = 0;
    let schemaReady = true;
    try {
      const rows = await sql`SELECT count(*)::int AS n FROM campaigns`;
      campaignsCount = rows[0]?.n ?? 0;
    } catch {
      schemaReady = false; // relation "campaigns" does not exist yet
    }

    if (!schemaReady) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          reason: 'schema_missing',
          detail: 'Connected to Neon, but the campaigns table is absent. Run db/migrations/0001_init.sql.',
          latencyMs: Date.now() - started,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        db: 'connected',
        schemaReady: true,
        campaignsCount,
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        reason: 'db_unreachable',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    );
  }
}
