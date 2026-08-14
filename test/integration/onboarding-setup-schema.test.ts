import { execFileSync, execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPrismaClient } from "../../src/shared/db";
import { startEphemeralPostgres } from "../helpers/postgres";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

interface SetupTableRow {
  tableName: string;
  rlsEnabled: boolean;
  rlsForced: boolean;
  policyCount: number;
  organizationNullable: string;
}

describe("onboarding-setup schema invariants 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("owns one setup row per Organization under forced RLS", async () => {
    const rows = await db.prisma.$queryRaw<SetupTableRow[]>`
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
      WHERE n.nspname = 'public' AND c.relname = 'onboarding_setup'
    `;

    expect(rows).toEqual([
      {
        tableName: "onboarding_setup",
        rlsEnabled: true,
        rlsForced: true,
        policyCount: 1,
        organizationNullable: "NO",
      },
    ]);

    const constraints = await db.prisma.$queryRaw<{ constraintName: string }[]>`
      SELECT conname AS "constraintName"
      FROM pg_constraint
      WHERE conname IN (
        'onboarding_setup_pkey',
        'onboarding_setup_organization_id_key',
        'onboarding_setup_organization_id_fkey',
        'onboarding_setup_profile_valid'
      )
      ORDER BY conname
    `;
    expect(constraints.map((row) => row.constraintName)).toEqual([
      "onboarding_setup_organization_id_fkey",
      "onboarding_setup_organization_id_key",
      "onboarding_setup_pkey",
      "onboarding_setup_profile_valid",
    ]);
  });

  it("uses typed status and step defaults and grants the application role access", async () => {
    const columns = await db.prisma.$queryRaw<
      Array<{
        columnName: string;
        udtName: string;
        nullable: string;
        defaultValue: string | null;
      }>
    >`
      SELECT column_name AS "columnName", udt_name AS "udtName",
             is_nullable AS nullable, column_default AS "defaultValue"
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'onboarding_setup'
        AND column_name IN ('status', 'current_step')
      ORDER BY column_name
    `;

    expect(columns).toEqual([
      {
        columnName: "current_step",
        udtName: "OnboardingSetupStep",
        nullable: "NO",
        defaultValue: "'CompanyProfile'::\"OnboardingSetupStep\"",
      },
      {
        columnName: "status",
        udtName: "OnboardingSetupStatus",
        nullable: "NO",
        defaultValue: "'Pending'::\"OnboardingSetupStatus\"",
      },
    ]);

    const grants = await db.prisma.$queryRaw<{ privilege: string }[]>`
      SELECT privilege_type AS privilege
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'onboarding_setup'
        AND grantee = 'ensambla_app'
      ORDER BY privilege_type
    `;
    expect(grants.map((row) => row.privilege)).toEqual([
      "DELETE",
      "INSERT",
      "SELECT",
      "UPDATE",
    ]);
  });

  it("backfills a pre-existing Organization and grants an existing app role", async () => {
    const pg = await startEphemeralPostgres();
    const admin = createPrismaClient(pg.connectionUri);
    const migrationUrl = new URL(
      "../../prisma/migrations/20260814160000_onboarding_guided_setup/migration.sql",
      import.meta.url,
    );
    try {
      execSync("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: pg.connectionUri },
        stdio: "pipe",
      });
      await admin.$executeRawUnsafe('DROP TABLE "onboarding_setup"');
      await admin.$executeRawUnsafe('DROP TYPE "OnboardingSetupStep"');
      await admin.$executeRawUnsafe('DROP TYPE "OnboardingSetupStatus"');
      await admin.$executeRawUnsafe("CREATE ROLE ensambla_app LOGIN NOSUPERUSER NOBYPASSRLS");
      const organizationId = randomUUID();
      await admin.organization.create({
        data: { id: organizationId, name: "Pre-existing Organization" },
      });

      execFileSync("npx", ["prisma", "db", "execute", "--file", migrationUrl.pathname], {
        env: { ...process.env, DATABASE_URL: pg.connectionUri },
        stdio: "pipe",
      });

      await expect(
        admin.onboardingSetup.findUnique({ where: { organizationId } }),
      ).resolves.toMatchObject({ status: "Skipped", currentStep: "CompanyProfile" });
      const grants = await admin.$queryRaw<{ privilege: string }[]>`
        SELECT privilege_type AS privilege
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND table_name = 'onboarding_setup'
          AND grantee = 'ensambla_app'
        ORDER BY privilege_type
      `;
      expect(grants.map((row) => row.privilege)).toEqual([
        "DELETE",
        "INSERT",
        "SELECT",
        "UPDATE",
      ]);
    } finally {
      await admin.$disconnect();
      await pg.stop();
    }
  });
});
