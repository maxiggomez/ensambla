import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { inviteMember } from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import { createLeanFixture } from "../helpers/lean-experiments";

import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

interface TableSecurityRow {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
  policyCount: number;
  organizationNullable: string;
}

describe("feedback-growth schema invariants 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("protects every Feedback & Growth tenant table with Organization ownership and RLS", async () => {
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
        AND c.relname IN (
          'feedback_request', 'feedback', 'kudo',
          'growth_plan', 'growth_target', 'growth_evidence'
        )
      ORDER BY c.relname
    `;

    expect(rows).toEqual([
      {
        tableName: "feedback",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "feedback_request",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "growth_evidence",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "growth_plan",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "growth_target",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
      {
        tableName: "kudo",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
    ]);
  });

  it("enforces typed sources, target bounds, one-to-one fulfillment and tenant-safe links", async () => {
    const constraints = await db.prisma.$queryRaw<{ constraintName: string }[]>`
      SELECT conname AS "constraintName"
      FROM pg_constraint
      WHERE conname IN (
        'feedback_request_organization_id_requester_id_fkey',
        'feedback_request_organization_id_requested_from_id_fkey',
        'feedback_organization_id_author_id_fkey',
        'feedback_organization_id_recipient_id_fkey',
        'feedback_organization_id_project_id_fkey',
        'feedback_organization_id_request_id_fkey',
        'feedback_request_id_key',
        'kudo_context_exclusive',
        'kudo_context_snapshot_valid',
        'kudo_organization_id_giver_id_fkey',
        'kudo_organization_id_recipient_id_fkey',
        'growth_plan_organization_id_member_id_fkey',
        'growth_target_organization_id_growth_plan_id_fkey',
        'growth_target_organization_id_skill_id_fkey',
        'growth_target_level_valid',
        'growth_evidence_organization_id_growth_plan_id_fkey',
        'growth_evidence_organization_id_feedback_id_fkey',
        'growth_evidence_organization_id_project_id_fkey',
        'growth_evidence_source_valid'
      )
      ORDER BY conname
    `;

    expect(constraints.map((row) => row.constraintName)).toHaveLength(19);

    const projectStatus = await db.prisma.$queryRaw<
      Array<{
        dataType: string;
        udtName: string;
        nullable: string;
        defaultValue: string | null;
      }>
    >`
      SELECT data_type AS "dataType", udt_name AS "udtName", is_nullable AS nullable,
             column_default AS "defaultValue"
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'project' AND column_name = 'status'
    `;
    expect(projectStatus).toEqual([
      {
        dataType: "USER-DEFINED",
        udtName: "ProjectStatus",
        nullable: "NO",
        defaultValue: "'Active'::\"ProjectStatus\"",
      },
    ]);
  });

  it("rejects a Kudo context without its retained title snapshot", async () => {
    const fixture = await createLeanFixture(db.prisma, "kudo_snapshot_constraint");
    const recipient = await inviteMember(
      {
        actorClerkUserId: fixture.actorClerkUserId,
        email: "recipient@kudo-snapshot.test",
        name: "Snapshot Recipient",
        role: "Colaborador",
      },
      db.prisma,
    );

    await expect(
      withTenant(
        fixture.organizationId,
        (tx) =>
          tx.$executeRaw`
            INSERT INTO "kudo" (
              "id", "organization_id", "giver_id", "recipient_id",
              "message", "value", "objective_id", "objective_title_snapshot"
            ) VALUES (
              ${randomUUID()}::uuid, ${fixture.organizationId}::uuid,
              ${fixture.memberId}::uuid, ${recipient.memberId}::uuid,
              'Snapshot ausente', 'Ownership', ${fixture.objectiveId}::uuid, NULL
            )
          `,
        db.prisma,
      ),
    ).rejects.toThrow();
  });
});
