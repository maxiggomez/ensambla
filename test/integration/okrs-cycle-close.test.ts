import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  archiveObjective,
  carryOverKeyResult,
  closeObjective,
  createObjective,
  createOkrCycle,
  getObjective,
  gradeKeyResult,
  listOkrAudit,
  publishObjective,
  recordCheckIn,
  updateKeyResultValue,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("OKR cycle close and history", () => {
  let db: TestDatabase;
  let organizationId: OrganizationId;
  let memberId: string;
  let scenarioNumber = 0;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId } = await createOrganization(
      {
        clerkUserId: "cycle_direction",
        name: "Cycle org",
        creatorEmail: "direction@cycle.test",
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

  async function createScenario() {
    scenarioNumber += 1;
    const currentCycle = await createOkrCycle(
      {
        actorClerkUserId: "cycle_direction",
        name: `Q1 2026 scenario ${scenarioNumber}`,
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: new Date("2026-03-31T23:59:59.999Z"),
      },
      db.prisma,
    );
    const { cycleId: nextCycleId } = await createOkrCycle(
      {
        actorClerkUserId: "cycle_direction",
        name: `Q2 2026 scenario ${scenarioNumber}`,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: new Date("2026-06-30T23:59:59.999Z"),
      },
      db.prisma,
    );
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "cycle_direction",
        title: `Expandir mercado ${scenarioNumber}`,
        level: "Company",
        ownerMemberId: memberId,
        cycleId: currentCycle.cycleId,
      },
      db.prisma,
    );
    const { keyResultId: firstKeyResultId } = await addKeyResult(
      {
        actorClerkUserId: "cycle_direction",
        objectiveId,
        title: "Nuevos clientes",
        measurementType: "integer",
        startValue: 0,
        targetValue: 20,
      },
      db.prisma,
    );
    const { keyResultId: secondKeyResultId } = await addKeyResult(
      {
        actorClerkUserId: "cycle_direction",
        objectiveId,
        title: "Playbook regional",
        measurementType: "text",
      },
      db.prisma,
    );
    await publishObjective({ actorClerkUserId: "cycle_direction", objectiveId }, db.prisma);
    return { objectiveId, firstKeyResultId, secondKeyResultId, nextCycleId };
  }

  async function gradeAndClose(scenario: Awaited<ReturnType<typeof createScenario>>) {
    await gradeKeyResult(
      {
        actorClerkUserId: "cycle_direction",
        keyResultId: scenario.firstKeyResultId,
        grade: "Partial",
      },
      db.prisma,
    );
    await gradeKeyResult(
      {
        actorClerkUserId: "cycle_direction",
        keyResultId: scenario.secondKeyResultId,
        grade: "Achieved",
      },
      db.prisma,
    );
    await closeObjective(
      { actorClerkUserId: "cycle_direction", objectiveId: scenario.objectiveId },
      db.prisma,
    );
  }

  it("rejects close until every KeyResult is graded", async () => {
    const scenario = await createScenario();
    await gradeKeyResult(
      {
        actorClerkUserId: "cycle_direction",
        keyResultId: scenario.firstKeyResultId,
        grade: "Partial",
      },
      db.prisma,
    );
    await expect(
      closeObjective(
        { actorClerkUserId: "cycle_direction", objectiveId: scenario.objectiveId },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/ungraded-key-results" });
  });

  it("stores grades and closes only a fully graded Objective", async () => {
    const scenario = await createScenario();
    await gradeAndClose(scenario);
    const objective = await getObjective(
      { actorClerkUserId: "cycle_direction", objectiveId: scenario.objectiveId },
      db.prisma,
    );
    expect(objective.status).toBe("Closed");
    const audit = await listOkrAudit({ actorClerkUserId: "cycle_direction" }, db.prisma);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining(["KEY_RESULT_GRADED", "OBJECTIVE_CLOSED"]),
    );
  });

  it("copies a KeyResult into the next cycle without mutating history", async () => {
    const scenario = await createScenario();
    await gradeAndClose(scenario);
    const carried = await carryOverKeyResult(
      {
        actorClerkUserId: "cycle_direction",
        keyResultId: scenario.firstKeyResultId,
        destinationCycleId: scenario.nextCycleId,
      },
      db.prisma,
    );
    const rows = await withTenant(
      organizationId,
      async (tx) => ({
        objective: await tx.objective.findUniqueOrThrow({ where: { id: carried.objectiveId } }),
        keyResult: await tx.keyResult.findUniqueOrThrow({ where: { id: carried.keyResultId } }),
        source: await tx.keyResult.findUniqueOrThrow({
          where: { id: scenario.firstKeyResultId },
        }),
      }),
      db.prisma,
    );
    expect(rows.objective).toMatchObject({
      status: "Draft",
      cycleId: scenario.nextCycleId,
      sourceObjectiveId: scenario.objectiveId,
    });
    expect(rows.keyResult.sourceKeyResultId).toBe(scenario.firstKeyResultId);
    expect(rows.source.grade).toBe("Partial");
    const audit = await listOkrAudit({ actorClerkUserId: "cycle_direction" }, db.prisma);
    expect(audit.map((event) => event.action)).toContain("KEY_RESULT_CARRIED_OVER");
  });

  it("archives closed history and rejects later mutation", async () => {
    const scenario = await createScenario();
    await gradeAndClose(scenario);
    await archiveObjective(
      { actorClerkUserId: "cycle_direction", objectiveId: scenario.objectiveId },
      db.prisma,
    );
    const objective = await getObjective(
      { actorClerkUserId: "cycle_direction", objectiveId: scenario.objectiveId },
      db.prisma,
    );
    expect(objective.status).toBe("Archived");
    const audit = await listOkrAudit({ actorClerkUserId: "cycle_direction" }, db.prisma);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "OKR_CYCLE_CREATED",
        "KEY_RESULT_GRADED",
        "OBJECTIVE_CLOSED",
        "OBJECTIVE_ARCHIVED",
      ]),
    );
    await expect(
      recordCheckIn(
        {
          actorClerkUserId: "cycle_direction",
          keyResultId: scenario.firstKeyResultId,
          value: 10,
          confidence: 8,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/objective-read-only" });
    await expect(
      updateKeyResultValue(
        {
          actorClerkUserId: "cycle_direction",
          keyResultId: scenario.firstKeyResultId,
          value: 10,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/objective-read-only" });
    await expect(
      addKeyResult(
        {
          actorClerkUserId: "cycle_direction",
          objectiveId: scenario.objectiveId,
          title: "No permitido",
          measurementType: "check",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/objective-read-only" });
  });
});
