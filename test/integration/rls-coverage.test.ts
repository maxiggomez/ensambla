import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * 🔒 CI check (ADR-0003): every tenant table MUST ship its RLS policy in the
 * migration that creates it. A tenant table is any table with an
 * `organization_id` column, plus `organization` itself. Adding a future table
 * without ENABLE + FORCE ROW LEVEL SECURITY and at least one policy fails CI.
 */
interface RlsStatusRow {
  table_name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
  policy_count: number;
}

describe("RLS coverage of tenant tables 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("every tenant table has RLS enabled, forced, and at least one policy", async () => {
    const rows = await db.prisma.$queryRaw<RlsStatusRow[]>`
      SELECT
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS rls_forced,
        (
          SELECT count(*)::int
          FROM pg_policies p
          WHERE p.schemaname = 'public' AND p.tablename = c.relname
        ) AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
        AND (
          c.relname = 'organization'
          OR EXISTS (
            SELECT 1
            FROM information_schema.columns col
            WHERE col.table_schema = 'public'
              AND col.table_name = c.relname
              AND col.column_name = 'organization_id'
          )
        )
    `;

    // At least organization + member must exist as tenant tables.
    const tableNames = rows.map((r) => r.table_name);
    expect(tableNames).toContain("organization");
    expect(tableNames).toContain("member");

    const unprotected = rows.filter(
      (r) => !r.rls_enabled || !r.rls_forced || r.policy_count < 1,
    );
    expect(
      unprotected,
      `tenant tables without full RLS: ${JSON.stringify(unprotected)}`,
    ).toEqual([]);
  });
});
