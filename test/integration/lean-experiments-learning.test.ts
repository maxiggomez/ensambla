import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  closeExperiment,
  createExperiment,
  listExperimentBoard,
  listLearnings,
  startBuilding,
  startMeasuring,
} from "../../src/modules/lean-experiments/application";
import { withTenant } from "../../src/shared/db";
import { createLeanFixture, type LeanFixture } from "../helpers/lean-experiments";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("close experiments and browse learnings", () => {
  let db: TestDatabase;
  let orgA: LeanFixture;
  let orgB: LeanFixture;
  let experimentId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await createLeanFixture(db.prisma, "learn_a");
    orgB = await createLeanFixture(db.prisma, "learn_b");
    ({ experimentId } = await createExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        keyResultId: orgA.keyResultId,
        belief: "la guía ayuda",
        expectedOutcome: "sube activación",
      },
      db.prisma,
    ));
    await startBuilding({ actorClerkUserId: orgA.actorClerkUserId, experimentId }, db.prisma);
    await startMeasuring(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        experimentId,
        measurement: { type: "percentage", start: 10, target: 40, current: 25 },
        cutoffAt: new Date("2026-09-30T00:00:00Z"),
      },
      db.prisma,
    );
  });

  afterAll(async () => db.stop());

  it("keeps Measuring when structured learning or decision is incomplete", async () => {
    await expect(
      closeExperiment(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          experimentId,
          believed: "belief",
          tested: "",
          learned: "learning",
          decision: "pivot",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "lean-experiments/invalid-learning" });
    const board = await listExperimentBoard(
      { actorClerkUserId: orgA.actorClerkUserId },
      db.prisma,
    );
    expect(board.Measuring.some((card) => card.experimentId === experimentId)).toBe(true);
  });

  it("atomically creates exactly one structured Learning and becomes Learned", async () => {
    await closeExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        experimentId,
        believed: "los usuarios necesitaban guía",
        tested: "un wizard",
        learned: "la activación aumentó",
        decision: "persevere",
      },
      db.prisma,
    );
    const stored = await withTenant(
      orgA.organizationId,
      (tx) => tx.learning.findMany({ where: { experimentId } }),
      db.prisma,
    );
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      believed: "los usuarios necesitaban guía",
      tested: "un wizard",
      learned: "la activación aumentó",
      decision: "Persevere",
    });
    const board = await listExperimentBoard(
      { actorClerkUserId: orgA.actorClerkUserId },
      db.prisma,
    );
    expect(board.Learned.some((card) => card.experimentId === experimentId)).toBe(true);
    await expect(
      closeExperiment(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          experimentId,
          believed: "again",
          tested: "again",
          learned: "again",
          decision: "pivot",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "lean-experiments/invalid-transition" });
  });

  it("lists structured learning with KR and Objective only for its tenant", async () => {
    const foreignExperiment = await createExperiment(
      {
        actorClerkUserId: orgB.actorClerkUserId,
        keyResultId: orgB.keyResultId,
        belief: "foreign",
        expectedOutcome: "foreign",
      },
      db.prisma,
    );
    expect(foreignExperiment.experimentId).toBeTruthy();

    const own = await createExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        keyResultId: orgA.keyResultId,
        belief: "library belief",
        expectedOutcome: "library outcome",
      },
      db.prisma,
    );
    await startBuilding(
      { actorClerkUserId: orgA.actorClerkUserId, experimentId: own.experimentId },
      db.prisma,
    );
    await startMeasuring(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        experimentId: own.experimentId,
        measurement: { type: "check", done: true },
        cutoffAt: new Date("2026-10-01T00:00:00Z"),
      },
      db.prisma,
    );
    await closeExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        experimentId: own.experimentId,
        believed: "library believed",
        tested: "library tested",
        learned: "library learned",
        decision: "pivot",
      },
      db.prisma,
    );

    const library = await listLearnings({ actorClerkUserId: orgA.actorClerkUserId }, db.prisma);
    expect(
      library.find((learning) => learning.experimentId === own.experimentId),
    ).toMatchObject({
      keyResultId: orgA.keyResultId,
      keyResultTitle: "KeyResult learn_a",
      objectiveId: orgA.objectiveId,
      objectiveTitle: "Objective learn_a",
      decision: "pivot",
    });
    expect(
      library.some((learning) => learning.experimentId === foreignExperiment.experimentId),
    ).toBe(false);
  });
});
