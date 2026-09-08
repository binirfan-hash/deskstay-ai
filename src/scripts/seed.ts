/**
 * Seed stub — RETIRED.
 *
 * Seeding moved to SQL: collab/specs/002_seed.sql (Supabase Postgres, applied
 * by the orchestrator via MCP execute_sql/apply_migration — contract
 * amendments A1/A4). The old better-sqlite3 seeding pipeline (src/lib/db.ts)
 * was removed together with the custom auth stack.
 *
 * Kept as a no-op so the binding package.json script `npm run seed` still
 * exits 0 until the orchestrator retires it.
 */
function main() {
  console.log("Seed moved to collab/specs/002_seed.sql — apply via Supabase SQL (see collab/backend-status.md).");
}

main();