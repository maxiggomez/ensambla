import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

interface TableSecurityRow {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
  policyCount: number;
}

describe("strategy-northstar schema invariants 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("holds vision, mission and values on the Organization", async () => {
    const columns = await db.prisma.$queryRaw<{ columnName: string; dataType: string }[]>`
      SELECT column_name AS "columnName", data_type AS "dataType"
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization'
        AND column_name IN ('vision', 'mission', 'values')
      ORDER BY column_name
    `;
    expect(columns.map((column) => column.columnName)).toEqual(["mission", "values", "vision"]);
    expect(columns.find((column) => column.columnName === "values")?.dataType).toBe("ARRAY");
  });

  it("protects every strategy-northstar tenant table with ENABLE + FORCE RLS", async () => {
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
        AND c.relname IN ('north_star_lever', 'strategic_pillar', 'pillar_objective')
      ORDER BY c.relname
    `;

    expect(rows).toEqual([
      { tableName: "north_star_lever", rlsEnabled: true, rlsForced: true, policyCount: 1 },
      { tableName: "pillar_objective", rlsEnabled: true, rlsForced: true, policyCount: 1 },
      { tableName: "strategic_pillar", rlsEnabled: true, rlsForced: true, policyCount: 1 },
    ]);
  });

  it("keeps organization_id NOT NULL and unique pillar × objective", async () => {
    const tables = ["north_star_lever", "strategic_pillar", "pillar_objective"];
    for (const tableName of tables) {
      const columns = await db.prisma.$queryRaw<{ nullable: string }[]>`
        SELECT is_nullable AS nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
          AND column_name = 'organization_id'
      `;
      expect(columns[0]?.nullable).toBe("NO");
    }

    const uniqueIndex = await db.prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'pillar_objective'
        AND indexname = 'pillar_objective_pillar_id_objective_id_key'
    `;
    expect(uniqueIndex[0]?.count).toBe(1);
  });
});
