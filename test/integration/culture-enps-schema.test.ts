import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

interface TableSecurityRow {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
  policyCount: number;
}

describe("culture-enps schema invariants 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("protects every culture-enps tenant table with ENABLE + FORCE RLS", async () => {
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
        AND c.relname IN ('pulse', 'pulse_schedule', 'pulse_participation', 'pulse_response')
      ORDER BY c.relname
    `;

    expect(rows).toEqual([
      { tableName: "pulse", rlsEnabled: true, rlsForced: true, policyCount: 1 },
      {
        tableName: "pulse_participation",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
      },
      { tableName: "pulse_response", rlsEnabled: true, rlsForced: true, policyCount: 1 },
      { tableName: "pulse_schedule", rlsEnabled: true, rlsForced: true, policyCount: 1 },
    ]);
  });

  it("stores responses without an identity column or identity foreign key", async () => {
    const participationColumns = await db.prisma.$queryRaw<{ columnName: string }[]>`
      SELECT column_name AS "columnName"
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pulse_participation'
      ORDER BY ordinal_position
    `;
    expect(participationColumns.map((column) => column.columnName)).toContain("responded");
    expect(participationColumns.map((column) => column.columnName)).not.toContain(
      "responded_at",
    );

    const columns = await db.prisma.$queryRaw<{ columnName: string; nullable: string }[]>`
      SELECT column_name AS "columnName", is_nullable AS nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pulse_response'
      ORDER BY ordinal_position
    `;
    const names = columns.map((column) => column.columnName);

    expect(names).toEqual([
      "id",
      "organization_id",
      "pulse_id",
      "team_id",
      "measurement_type",
      "start_value",
      "target_value",
      "current_value",
      "check_done",
      "text_state",
      "driver",
      "comment",
      "submitted_at",
    ]);
    expect(names).not.toContain("member_id");
    expect(names).not.toContain("participation_id");
    expect(names).not.toContain("clerk_user_id");
    expect(columns.find((column) => column.columnName === "organization_id")?.nullable).toBe(
      "NO",
    );

    const identityForeignKeys = await db.prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'pulse_response'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name IN ('member', 'pulse_participation')
    `;
    expect(identityForeignKeys[0]?.count).toBe(0);
  });

  it("rejects UPDATE and DELETE of an anonymous response at database level", async () => {
    const orgId = "10000000-0000-4000-8000-000000000001" as OrganizationId;
    const pulseId = "20000000-0000-4000-8000-000000000001";
    const responseId = "30000000-0000-4000-8000-000000000001";

    await withTenant(
      orgId,
      async (tx) => {
        await tx.$executeRaw`
          INSERT INTO organization (id, name) VALUES (${orgId}::uuid, 'Org schema test')
        `;
        await tx.$executeRaw`
          INSERT INTO pulse (id, organization_id, scope, status, opened_at)
          VALUES (${pulseId}::uuid, ${orgId}::uuid, 'Organization', 'Open', now())
        `;
        await tx.$executeRaw`
          INSERT INTO pulse_response (
            id, organization_id, pulse_id, measurement_type,
            start_value, target_value, current_value, driver
          ) VALUES (
            ${responseId}::uuid, ${orgId}::uuid, ${pulseId}::uuid, 'Integer',
            0, 10, 9, 'Recognition'
          )
        `;
      },
      db.prisma,
    );

    await expect(
      withTenant(
        orgId,
        (tx) =>
          tx.$executeRaw`UPDATE pulse_response SET comment = 'mutated' WHERE id = ${responseId}::uuid`,
        db.prisma,
      ),
    ).rejects.toThrow(/immutable/i);
    await expect(
      withTenant(
        orgId,
        (tx) => tx.$executeRaw`DELETE FROM pulse_response WHERE id = ${responseId}::uuid`,
        db.prisma,
      ),
    ).rejects.toThrow(/immutable/i);
  });
});
