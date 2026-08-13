import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

interface TableSecurityRow {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
  policyCount: number;
  organizationNullable: string;
}

describe("lean-experiments schema invariants 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("protects every Lean tenant table with organization ownership and RLS", async () => {
    const rows = await db.prisma.$queryRaw<TableSecurityRow[]>`
      SELECT
        c.relname AS "tableName",
        c.relrowsecurity AS "rlsEnabled",
        c.relforcerowsecurity AS "rlsForced",
        (SELECT count(*)::int FROM pg_policies p
          WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS "policyCount",
        cols.is_nullable AS "organizationNullable"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN information_schema.columns cols
        ON cols.table_schema = n.nspname
       AND cols.table_name = c.relname
       AND cols.column_name = 'organization_id'
      WHERE n.nspname = 'public'
        AND c.relname IN ('hypothesis', 'experiment', 'learning')
      ORDER BY c.relname
    `;

    expect(rows).toEqual([
      {
        tableName: "experiment",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "hypothesis",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "learning",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
    ]);
  });

  it("enforces tenant-safe OKR links and one-to-one aggregate relationships", async () => {
    const constraints = await db.prisma.$queryRaw<{ constraintName: string }[]>`
      SELECT conname AS "constraintName"
      FROM pg_constraint
      WHERE conname IN (
        'hypothesis_organization_id_key_result_id_fkey',
        'hypothesis_organization_id_objective_id_fkey',
        'experiment_organization_id_hypothesis_id_fkey',
        'learning_organization_id_experiment_id_fkey',
        'experiment_hypothesis_id_key',
        'learning_experiment_id_key',
        'experiment_measurement_required',
        'learning_decision_valid'
      )
      ORDER BY conname
    `;
    expect(constraints.map((row) => row.constraintName)).toEqual([
      "experiment_hypothesis_id_key",
      "experiment_measurement_required",
      "experiment_organization_id_hypothesis_id_fkey",
      "hypothesis_organization_id_key_result_id_fkey",
      "hypothesis_organization_id_objective_id_fkey",
      "learning_decision_valid",
      "learning_experiment_id_key",
      "learning_organization_id_experiment_id_fkey",
    ]);
  });
});
