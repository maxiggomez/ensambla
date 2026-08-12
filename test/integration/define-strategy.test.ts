import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { defineStrategy, getStrategy } from "../../src/modules/strategy-northstar/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

async function seedOrgA(db: TestDatabase): Promise<OrganizationId> {
  const { organizationId } = await createOrganization(
    {
      clerkUserId: "user_ana",
      name: "Org A",
      creatorEmail: "ana@org-a.com",
      creatorName: "Ana",
    },
    db.prisma,
  );
  for (const [email, name, role, clerkUserId] of [
    ["leo@org-a.com", "Leo", "Lider", "user_leo"],
    ["carla@org-a.com", "Carla", "Colaborador", "user_carla"],
  ] as const) {
    await inviteMember({ actorClerkUserId: "user_ana", email, name, role }, db.prisma);
    await withTenant(
      organizationId,
      (tx) =>
        tx.member.update({
          where: { organizationId_email: { organizationId, email } },
          data: { clerkUserId },
        }),
      db.prisma,
    );
  }
  return organizationId;
}

describe("strategy statements (vision, mission, values)", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await seedOrgA(db);
  });

  afterAll(async () => {
    await db.stop();
  });

  it("Dirección defines vision, mission and values and any member reads them", async () => {
    await defineStrategy(
      {
        actorClerkUserId: "user_ana",
        vision: "Ser la empresa más ágil de su industria",
        mission: "Ayudar a pymes a alinearse",
        values: ["Cercanía", "Candor"],
      },
      db.prisma,
    );

    const seenByCarla = await getStrategy({ actorClerkUserId: "user_carla" }, db.prisma);
    expect(seenByCarla).toEqual({
      vision: "Ser la empresa más ágil de su industria",
      mission: "Ayudar a pymes a alinearse",
      values: ["Cercanía", "Candor"],
    });
  });

  it("redefining replaces the statements without dropping the rest", async () => {
    await defineStrategy(
      {
        actorClerkUserId: "user_ana",
        vision: "Nueva visión",
        values: ["Candor"],
      },
      db.prisma,
    );

    const seen = await getStrategy({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(seen).toEqual({
      vision: "Nueva visión",
      mission: "Ayudar a pymes a alinearse",
      values: ["Candor"],
    });
  });

  it("Líder and Colaborador cannot define the strategy", async () => {
    for (const actorClerkUserId of ["user_leo", "user_carla"]) {
      await expect(
        defineStrategy(
          { actorClerkUserId, vision: "Intento no permitido", values: [] },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "strategy-northstar/forbidden" });
    }
  });

  it("the strategy is tenant-isolated 🔒", async () => {
    await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );

    const seenByB = await getStrategy({ actorClerkUserId: "user_bob" }, db.prisma);
    expect(seenByB).toEqual({ vision: null, mission: null, values: [] });

    const storedInA = await withTenant(
      orgA,
      (tx) =>
        tx.organization.findUniqueOrThrow({
          where: { id: orgA },
          select: { vision: true, mission: true, values: true },
        }),
      db.prisma,
    );
    expect(storedInA.vision).toBe("Nueva visión");
  });
});
