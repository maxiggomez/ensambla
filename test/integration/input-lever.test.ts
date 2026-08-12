import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOrganization,
  inviteMember,
  listMembers,
} from "../../src/modules/identity-org/application";
import { createObjective } from "../../src/modules/okrs/application";
import {
  addInputLever,
  defineNorthStar,
} from "../../src/modules/strategy-northstar/application";
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

describe("North Star input levers", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let anaId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await seedOrgA(db);
    const members = await listMembers({ actorClerkUserId: "user_ana" }, db.prisma);
    anaId = members.find((member) => member.clerkUserId === "user_ana")!.id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("rejects a lever when the North Star is not defined", async () => {
    await expect(
      addInputLever({ actorClerkUserId: "user_ana", name: "Leads" }, db.prisma),
    ).rejects.toMatchObject({ code: "strategy-northstar/no-north-star" });
  });

  it("Dirección adds a lever linked to an Objective of the same organization", async () => {
    await defineNorthStar(
      {
        actorClerkUserId: "user_ana",
        name: "ARR",
        measurement: { type: "currency", start: 0, target: 1_000_000, current: 250_000 },
      },
      db.prisma,
    );
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Lanzar el canal de partners",
        level: "Person",
        ownerMemberId: anaId,
      },
      db.prisma,
    );

    await addInputLever(
      {
        actorClerkUserId: "user_ana",
        name: "Leads calificados",
        objectiveId,
      },
      db.prisma,
    );
    await addInputLever({ actorClerkUserId: "user_ana", name: "Conversión" }, db.prisma);

    const levers = await withTenant(
      orgA,
      (tx) => tx.northStarLever.findMany({ orderBy: { createdAt: "asc" } }),
      db.prisma,
    );
    expect(levers).toHaveLength(2);
    expect(levers[0]).toMatchObject({ name: "Leads calificados", objectiveId });
    expect(levers[1]).toMatchObject({ name: "Conversión", objectiveId: null });
  });

  it("rejects a lever linked to an Objective of another organization", async () => {
    await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );
    const bobMembers = await listMembers({ actorClerkUserId: "user_bob" }, db.prisma);
    const bobId = bobMembers.find((member) => member.clerkUserId === "user_bob")!.id;
    await defineNorthStar(
      {
        actorClerkUserId: "user_bob",
        name: "NS B",
        measurement: { type: "check", done: false },
      },
      db.prisma,
    );
    const { objectiveId: objectiveB } = await createObjective(
      {
        actorClerkUserId: "user_bob",
        title: "Objetivo de B",
        level: "Person",
        ownerMemberId: bobId,
      },
      db.prisma,
    );

    await expect(
      addInputLever(
        { actorClerkUserId: "user_ana", name: "Lever inválido", objectiveId: objectiveB },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "strategy-northstar/objective-not-found" });
  });

  it("Líder and Colaborador cannot add levers", async () => {
    for (const actorClerkUserId of ["user_leo", "user_carla"]) {
      await expect(
        addInputLever({ actorClerkUserId, name: "Intento no permitido" }, db.prisma),
      ).rejects.toMatchObject({ code: "strategy-northstar/forbidden" });
    }
  });

  it("levers are tenant-isolated 🔒", async () => {
    const leversInB = await withTenant(orgA, (tx) => tx.northStarLever.findMany(), db.prisma);
    expect(leversInB.length).toBeGreaterThan(0);

    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob2",
        name: "Org B2",
        creatorEmail: "bob2@org-b.com",
        creatorName: "Bob2",
      },
      db.prisma,
    );
    const seenByB = await withTenant(orgB, (tx) => tx.northStarLever.findMany(), db.prisma);
    expect(seenByB).toEqual([]);
  });
});
