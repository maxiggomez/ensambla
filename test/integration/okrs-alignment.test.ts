import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  getAlignmentChain,
  getObjective,
  linkObjectiveParent,
  listOkrAudit,
} from "../../src/modules/okrs/application";
import {
  assignObjectiveToPillar,
  createStrategicPillar,
  defineNorthStar,
} from "../../src/modules/strategy-northstar/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("OKR alignment cascade", () => {
  let db: TestDatabase;
  let organizationId: OrganizationId;
  let memberId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId } = await createOrganization(
      {
        clerkUserId: "alignment_direction",
        name: "Alignment org",
        creatorEmail: "direction@alignment.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    memberId = (
      await withTenant(organizationId, (tx) => tx.member.findFirstOrThrow(), db.prisma)
    ).id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("builds the chain through parent Objective and Pillar to the North Star", async () => {
    await defineNorthStar(
      {
        actorClerkUserId: "alignment_direction",
        name: "Clientes activos",
        measurement: { type: "integer", start: 100, target: 200, current: 120 },
      },
      db.prisma,
    );
    const { pillarId } = await createStrategicPillar(
      { actorClerkUserId: "alignment_direction", name: "Crecimiento" },
      db.prisma,
    );
    const { objectiveId: parentObjectiveId } = await createObjective(
      {
        actorClerkUserId: "alignment_direction",
        title: "Crecer cartera",
        level: "Company",
        ownerMemberId: memberId,
      },
      db.prisma,
    );
    await assignObjectiveToPillar(
      {
        actorClerkUserId: "alignment_direction",
        pillarId,
        objectiveId: parentObjectiveId,
      },
      db.prisma,
    );
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "alignment_direction",
        title: "Activar cuentas",
        level: "Area",
        ownerMemberId: memberId,
        parentObjectiveId,
      },
      db.prisma,
    );
    const { keyResultId } = await addKeyResult(
      {
        actorClerkUserId: "alignment_direction",
        objectiveId,
        title: "Activaciones",
        measurementType: "integer",
        startValue: 0,
        targetValue: 50,
      },
      db.prisma,
    );

    const chain = await getAlignmentChain(
      { actorClerkUserId: "alignment_direction", keyResultId },
      db.prisma,
    );
    expect(chain.objectives.map((objective) => objective.title)).toEqual([
      "Activar cuentas",
      "Crecer cartera",
    ]);
    expect(chain.pillar?.name).toBe("Crecimiento");
    expect(chain.northStarName).toBe("Clientes activos");
  });

  it("derives orphan status when an Objective has no parent or Pillar", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "alignment_direction",
        title: "Objetivo huérfano",
        level: "Area",
        ownerMemberId: memberId,
      },
      db.prisma,
    );
    const objective = await getObjective(
      { actorClerkUserId: "alignment_direction", objectiveId },
      db.prisma,
    );
    expect(objective.isOrphan).toBe(true);
  });

  it("rejects a link that creates an Objective ancestry cycle", async () => {
    const first = await createObjective(
      {
        actorClerkUserId: "alignment_direction",
        title: "Primero",
        level: "Company",
        ownerMemberId: memberId,
      },
      db.prisma,
    );
    const second = await createObjective(
      {
        actorClerkUserId: "alignment_direction",
        title: "Segundo",
        level: "Area",
        ownerMemberId: memberId,
      },
      db.prisma,
    );
    await linkObjectiveParent(
      {
        actorClerkUserId: "alignment_direction",
        objectiveId: second.objectiveId,
        parentObjectiveId: first.objectiveId,
      },
      db.prisma,
    );
    const audit = await listOkrAudit({ actorClerkUserId: "alignment_direction" }, db.prisma);
    expect(audit.map((event) => event.action)).toContain("OBJECTIVE_PARENT_LINKED");
    await expect(
      linkObjectiveParent(
        {
          actorClerkUserId: "alignment_direction",
          objectiveId: first.objectiveId,
          parentObjectiveId: second.objectiveId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/alignment-cycle" });
  });
});
