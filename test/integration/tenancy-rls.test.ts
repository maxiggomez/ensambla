import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../../src/shared/db";
import { organizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * 🔒 Multi-tenancy invariant (ADR-0003): isolation is enforced by Postgres RLS,
 * not by application code. These tests are mandatory and must never be skipped.
 *
 * Prisma connects as the table owner, so they only pass if the migration uses
 * FORCE ROW LEVEL SECURITY (otherwise the owner silently bypasses RLS).
 */
describe("tenant isolation via RLS 🔒", () => {
  let db: TestDatabase;
  const ORG_A = organizationId(randomUUID());
  const ORG_B = organizationId(randomUUID());

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    // Organizations are seeded without tenant context (pre-tenant INSERT policy);
    // raw INSERT avoids RETURNING, which RLS would filter.
    await db.prisma.$executeRaw`
      INSERT INTO "organization" (id, name)
      VALUES (${ORG_A}::uuid, 'Org A'), (${ORG_B}::uuid, 'Org B')
    `;
    await withTenant(
      ORG_A,
      async (tx) => {
        await tx.member.create({
          data: {
            organizationId: ORG_A,
            email: "ana@org-a.com",
            name: "Ana",
            role: "Direccion",
          },
        });
      },
      db.prisma,
    );
    await withTenant(
      ORG_B,
      async (tx) => {
        await tx.member.create({
          data: {
            organizationId: ORG_B,
            email: "bruno@org-b.com",
            name: "Bruno",
            role: "Lider",
          },
        });
      },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("a query scoped to one tenant does not see members of another tenant", async () => {
    const membersOfA = await withTenant(ORG_A, (tx) => tx.member.findMany(), db.prisma);
    expect(membersOfA.map((m) => m.email)).toEqual(["ana@org-a.com"]);

    const membersOfB = await withTenant(ORG_B, (tx) => tx.member.findMany(), db.prisma);
    expect(membersOfB.map((m) => m.email)).toEqual(["bruno@org-b.com"]);
  });

  it("a query without tenant context returns no member rows", async () => {
    const members = await db.prisma.member.findMany();
    expect(members).toHaveLength(0);
  });

  it("writing a member for another tenant is rejected by the RLS policy", async () => {
    await expect(
      withTenant(
        ORG_A,
        (tx) =>
          tx.member.create({
            data: {
              organizationId: ORG_B,
              email: "intruso@org-a.com",
              name: "Intruso",
              role: "Colaborador",
            },
          }),
        db.prisma,
      ),
    ).rejects.toThrow();
  });

  it("a tenant only sees its own organization row", async () => {
    const orgs = await withTenant(ORG_A, (tx) => tx.organization.findMany(), db.prisma);
    expect(orgs.map((o) => o.id)).toEqual([ORG_A]);
  });
});
