import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

interface TableSecurityRow {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
  policyCount: number;
}

describe("okrs full-cycle schema invariants 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("creates every full-cycle tenant table with ENABLE + FORCE RLS", async () => {
    const rows = await db.prisma.$queryRaw<TableSecurityRow[]>`
      SELECT
        c.relname AS "tableName",
        c.relrowsecurity AS "rlsEnabled",
        c.relforcerowsecurity AS "rlsForced",
        (SELECT count(*)::int FROM pg_policies p
          WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS "policyCount"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (
          'check_in', 'check_in_evidence', 'okr_audit_event',
          'okr_cadence_config', 'okr_cycle'
        )
      ORDER BY c.relname
    `;

    expect(rows).toEqual([
      { tableName: "check_in", rlsEnabled: true, rlsForced: true, policyCount: 1 },
      {
        tableName: "check_in_evidence",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
      },
      { tableName: "okr_audit_event", rlsEnabled: true, rlsForced: true, policyCount: 2 },
      {
        tableName: "okr_cadence_config",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
      },
      { tableName: "okr_cycle", rlsEnabled: true, rlsForced: true, policyCount: 1 },
    ]);
  });

  it("does not persist derived progress, risk, or outdated state", async () => {
    const rows = await db.prisma.$queryRaw<{ tableName: string; columnName: string }[]>`
      SELECT table_name AS "tableName", column_name AS "columnName"
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('objective', 'key_result')
        AND column_name IN ('progress', 'at_risk', 'outdated')
    `;
    expect(rows).toEqual([]);
  });
});
