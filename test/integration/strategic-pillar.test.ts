import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOrganization,
  inviteMember,
  listMembers,
} from "../../src/modules/identity-org/application";
import { createObjective } from "../../src/modules/okrs/application";
import {
  assignObjectiveToPillar,
  createStrategicPillar,
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

describe("strategic pillars", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let objectiveA: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await seedOrgA(db);
    const members = await listMembers({ actorClerkUserId: "user_ana" }, db.prisma);
    const anaId = members.find((member) => member.clerkUserId === "user_ana")!.id;
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Lanzar el canal de partners",
        level: "Person",
        ownerMemberId: anaId,
      },
      db.prisma,
    );
    objectiveA = objectiveId;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("Dirección creates a pillar and groups objectives under it", async () => {
    const { pillarId } = await createStrategicPillar(
      {
        actorClerkUserId: "user_ana",
        name: "Crecimiento",
        description: "Palancas de expansión",
      },
      db.prisma,
    );

    await assignObjectiveToPillar(
      { actorClerkUserId: "user_ana", pillarId, objectiveId: objectiveA },
      db.prisma,
    );

    const pillar = await withTenant(
      orgA,
      (tx) =>
        tx.strategicPillar.findUnique({
          where: { id: pillarId },
          include: { objectiveLinks: true },
        }),
      db.prisma,
    );
    expect(pillar).toMatchObject({
      name: "Crecimiento",
      description: "Palancas de expansión",
    });
    expect(pillar?.objectiveLinks).toHaveLength(1);
    expect(pillar?.objectiveLinks[0].objectiveId).toBe(objectiveA);
  });

  it("rejects assigning the same objective twice to a pillar", async () => {
    const { pillarId } = await createStrategicPillar(
      { actorClerkUserId: "user_ana", name: "Otro pilar" },
      db.prisma,
    );
    await assignObjectiveToPillar(
      { actorClerkUserId: "user_ana", pillarId, objectiveId: objectiveA },
      db.prisma,
    );
    await expect(
      assignObjectiveToPillar(
        { actorClerkUserId: "user_ana", pillarId, objectiveId: objectiveA },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "strategy-northstar/already-assigned" });
  });

  it("rejects assigning an objective of another organization", async () => {
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
    const { objectiveId: objectiveB } = await createObjective(
      {
        actorClerkUserId: "user_bob",
        title: "Objetivo de B",
        level: "Person",
        ownerMemberId: bobId,
      },
      db.prisma,
    );
    const { pillarId } = await createStrategicPillar(
      { actorClerkUserId: "user_ana", name: "Pilar de A" },
      db.prisma,
    );

    await expect(
      assignObjectiveToPillar(
        { actorClerkUserId: "user_ana", pillarId, objectiveId: objectiveB },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "strategy-northstar/objective-not-found" });
  });

  it("Líder and Colaborador cannot create pillars; assignment is role-gated", async () => {
    for (const actorClerkUserId of ["user_leo", "user_carla"]) {
      await expect(
        createStrategicPillar({ actorClerkUserId, name: "Intento no permitido" }, db.prisma),
      ).rejects.toMatchObject({ code: "strategy-northstar/forbidden" });
    }
    const { pillarId } = await createStrategicPillar(
      { actorClerkUserId: "user_ana", name: "Pilar para permisos" },
      db.prisma,
    );
    // Validación del objetivo primero (convención cross-módulo): Carla no ve el
    // draft ajeno, así que el assign falla en la validación del objetivo.
    await expect(
      assignObjectiveToPillar(
        { actorClerkUserId: "user_carla", pillarId, objectiveId: objectiveA },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "strategy-northstar/objective-not-found" });
  });

  it("pillars are tenant-isolated 🔒", async () => {
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob2",
        name: "Org B2",
        creatorEmail: "bob2@org-b.com",
        creatorName: "Bob2",
      },
      db.prisma,
    );
    const seenByB = await withTenant(orgB, (tx) => tx.strategicPillar.findMany(), db.prisma);
    expect(seenByB).toEqual([]);
  });
});
