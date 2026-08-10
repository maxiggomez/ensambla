import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOrganization,
  inviteMember,
  listMembers,
} from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  updateKeyResultValue,
} from "../../src/modules/okrs/application";
import {
  addInputLever,
  assignObjectiveToPillar,
  createStrategicPillar,
  defineNorthStar,
  defineStrategy,
  getStrategicMap,
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

describe("strategic map", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    await seedOrgA(db);

    await defineStrategy(
      {
        actorClerkUserId: "user_ana",
        vision: "Ser la empresa más ágil de su industria",
        mission: "Ayudar a pymes a alinearse",
        values: ["Cercanía", "Candor"],
      },
      db.prisma,
    );
    await defineNorthStar(
      {
        actorClerkUserId: "user_ana",
        name: "ARR",
        measurement: { type: "currency", start: 0, target: 1_000_000, current: 250_000 },
      },
      db.prisma,
    );

    const members = await listMembers({ actorClerkUserId: "user_ana" }, db.prisma);
    const anaId = members.find((member) => member.clerkUserId === "user_ana")!.id;

    const { objectiveId: leveragedObjective } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Lanzar el canal de partners",
        level: "Person",
        ownerMemberId: anaId,
      },
      db.prisma,
    );
    const { keyResultId } = await addKeyResult(
      {
        actorClerkUserId: "user_ana",
        objectiveId: leveragedObjective,
        title: "Partners activos",
        measurementType: "percentage",
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
      },
      db.prisma,
    );
    await updateKeyResultValue(
      { actorClerkUserId: "user_ana", keyResultId, value: 50 },
      db.prisma,
    );
    await addInputLever(
      {
        actorClerkUserId: "user_ana",
        name: "Leads calificados",
        objectiveId: leveragedObjective,
      },
      db.prisma,
    );
    const { pillarId } = await createStrategicPillar(
      { actorClerkUserId: "user_ana", name: "Crecimiento" },
      db.prisma,
    );
    await assignObjectiveToPillar(
      { actorClerkUserId: "user_ana", pillarId, objectiveId: leveragedObjective },
      db.prisma,
    );

    await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Objetivo sin pilar",
        level: "Person",
        ownerMemberId: anaId,
      },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("shows the cascade with real derived progress and linked levers", async () => {
    const map = await getStrategicMap({ actorClerkUserId: "user_ana" }, db.prisma);

    expect(map.strategy).toEqual({
      vision: "Ser la empresa más ágil de su industria",
      mission: "Ayudar a pymes a alinearse",
      values: ["Cercanía", "Candor"],
    });
    expect(map.northStar).toMatchObject({
      name: "ARR",
      progress: 25,
    });
    expect(map.northStar?.levers).toHaveLength(1);
    expect(map.northStar?.levers[0]).toMatchObject({ name: "Leads calificados" });
    expect(map.northStar?.levers[0].objective).toMatchObject({
      title: "Lanzar el canal de partners",
      progress: 50,
    });

    expect(map.pillars).toHaveLength(1);
    expect(map.pillars[0]).toMatchObject({ name: "Crecimiento" });
    expect(map.pillars[0].objectives).toHaveLength(1);
    expect(map.pillars[0].objectives[0]).toMatchObject({
      title: "Lanzar el canal de partners",
      progress: 50,
    });

    expect(map.unassignedObjectives.map((objective) => objective.title)).toEqual([
      "Objetivo sin pilar",
    ]);
  });

  it("respects okrs visibility: a Colaborador does not see others' drafts", async () => {
    const map = await getStrategicMap({ actorClerkUserId: "user_carla" }, db.prisma);

    expect(map.strategy.vision).toBe("Ser la empresa más ágil de su industria");
    expect(map.pillars[0].objectives).toEqual([]);
    expect(map.unassignedObjectives).toEqual([]);
  });

  it("the map is tenant-isolated 🔒", async () => {
    await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );
    const mapB = await getStrategicMap({ actorClerkUserId: "user_bob" }, db.prisma);
    expect(mapB.strategy).toEqual({ vision: null, mission: null, values: [] });
    expect(mapB.northStar).toBeNull();
    expect(mapB.pillars).toEqual([]);
    expect(mapB.unassignedObjectives).toEqual([]);
  });
});
