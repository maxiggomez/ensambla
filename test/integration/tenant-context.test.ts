import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../../src/shared/db";
import { ApplicationError } from "../../src/shared/errors";
import { organizationId } from "../../src/shared/ids";
import { resolveTenantForUser, withTenantForUser } from "../../src/shared/tenancy";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * 🔒 Tenant context per request (ADR-0003 / foundation fase 4): an
 * authenticated user (Clerk id) derives their tenant from their Member row and
 * every query runs inside that tenant context. The member lookup itself goes
 * through RLS via the `app.current_user` self-lookup policy — no bypass.
 */
describe("tenant context from authenticated user 🔒", () => {
  let db: TestDatabase;
  const ORG_A = organizationId(randomUUID());
  const ORG_B = organizationId(randomUUID());

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    await db.prisma.$executeRaw`
      INSERT INTO "organization" (id, name)
      VALUES (${ORG_A}::uuid, 'Org A'), (${ORG_B}::uuid, 'Org B')
    `;
    // Ana belongs to both orgs; her membership in A is older (MVP: oldest wins).
    await withTenant(
      ORG_A,
      async (tx) => {
        await tx.member.create({
          data: {
            organizationId: ORG_A,
            email: "ana@org-a.com",
            name: "Ana",
            role: "Direccion",
            clerkUserId: "user_ana",
            createdAt: new Date("2026-01-01T00:00:00Z"),
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
            email: "ana@org-b.com",
            name: "Ana",
            role: "Colaborador",
            clerkUserId: "user_ana",
            createdAt: new Date("2026-02-01T00:00:00Z"),
          },
        });
        await tx.member.create({
          data: {
            organizationId: ORG_B,
            email: "bruno@org-b.com",
            name: "Bruno",
            role: "Lider",
            clerkUserId: "user_bruno",
            createdAt: new Date("2026-01-15T00:00:00Z"),
          },
        });
      },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("derives the tenant of the authenticated user from their Member", async () => {
    const orgId = await resolveTenantForUser("user_bruno", db.prisma);
    expect(orgId).toBe(ORG_B);
  });

  it("returns null for a user without a Member", async () => {
    const orgId = await resolveTenantForUser("user_fantasma", db.prisma);
    expect(orgId).toBeNull();
  });

  it("resolves the oldest membership when the user belongs to several orgs", async () => {
    const orgId = await resolveTenantForUser("user_ana", db.prisma);
    expect(orgId).toBe(ORG_A);
  });

  it("applies the resolved tenant to the query context", async () => {
    const members = await withTenantForUser(
      "user_ana",
      (tx) => tx.member.findMany(),
      db.prisma,
    );
    expect(members.map((m) => m.email)).toEqual(["ana@org-a.com"]);
  });

  it("rejects with an ApplicationError when the user has no Member", async () => {
    const attempt = withTenantForUser("user_fantasma", (tx) => tx.member.findMany(), db.prisma);
    await expect(attempt).rejects.toBeInstanceOf(ApplicationError);
    await expect(attempt).rejects.toMatchObject({ code: "tenancy/no-member" });
  });

  it("the self-lookup policy only exposes the user's own member rows 🔒", async () => {
    const rows = await db.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user', 'user_ana', true)`;
      return tx.member.findMany();
    });
    expect(rows.map((m) => m.email).sort()).toEqual(["ana@org-a.com", "ana@org-b.com"]);
    expect(rows.some((m) => m.clerkUserId === "user_bruno")).toBe(false);
  });

  it("the self-lookup context does not allow writes (policy is SELECT-only) 🔒", async () => {
    // Solo app.current_user seteado, sin tenant: leer las filas propias está
    // permitido, pero cualquier escritura debe rechazarla member_tenant_all.
    const write = db.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user', 'user_ana', true)`;
      return tx.member.create({
        data: {
          organizationId: ORG_A,
          email: "colada@org-a.com",
          name: "Colada",
          role: "Colaborador",
          clerkUserId: "user_ana_2",
        },
      });
    });
    await expect(write).rejects.toThrow();

    const update = db.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user', 'user_ana', true)`;
      return tx.member.updateMany({ data: { name: "Hackeada" } });
    });
    // updateMany sin filas visibles para UPDATE: no debe modificar ninguna.
    await expect(update).resolves.toMatchObject({ count: 0 });

    const remove = db.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user', 'user_ana', true)`;
      return tx.member.deleteMany();
    });
    await expect(remove).resolves.toMatchObject({ count: 0 });
  });
});
