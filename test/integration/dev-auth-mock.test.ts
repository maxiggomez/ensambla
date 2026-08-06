import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listMembers } from "../../src/modules/identity-org/application";
import { resolveTenantForUser } from "../../src/shared/tenancy";

import { seedDevData } from "../../scripts/seed-dev";

import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * dev-auth-mock: el id sintético `dev_*` es un string opaco igual que el de
 * Clerk — debe fluir por tenancy/RLS (`app.current_user`) y resolver el tenant
 * y el rol de los members sembrados por scripts/seed-dev.ts.
 */
describe("dev-auth-mock resolves the seeded tenant and roles 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    await seedDevData(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  it("the mock Direccion id resolves the seeded org and role", async () => {
    const orgId = await resolveTenantForUser("dev_direccion", db.prisma);
    expect(orgId).not.toBeNull();

    const members = await listMembers({ actorClerkUserId: "dev_direccion" }, db.prisma);
    const direccion = members.find((m) => m.clerkUserId === "dev_direccion");
    expect(direccion?.role).toBe("Direccion");
    expect(direccion?.email).toBe("ceo@ensambla.dev");
  });

  it("the mock Lider id resolves the same org as its email", async () => {
    const orgDev = await resolveTenantForUser("dev_direccion", db.prisma);
    await expect(resolveTenantForUser("dev_lider", db.prisma)).resolves.toBe(orgDev);

    const members = await listMembers({ actorClerkUserId: "dev_lider" }, db.prisma);
    const lider = members.find((m) => m.clerkUserId === "dev_lider");
    expect(lider?.role).toBe("Lider");
  });

  it("a mock id without a seeded member resolves no tenant", async () => {
    await expect(resolveTenantForUser("dev_unknown", db.prisma)).resolves.toBeNull();
  });
});
