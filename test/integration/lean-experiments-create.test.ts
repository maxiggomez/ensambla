import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createExperiment,
  listExperimentBoard,
} from "../../src/modules/lean-experiments/application";
import { withTenant } from "../../src/shared/db";
import { createLeanFixture, type LeanFixture } from "../helpers/lean-experiments";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("create and list Lean experiments", () => {
  let db: TestDatabase;
  let orgA: LeanFixture;
  let orgB: LeanFixture;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await createLeanFixture(db.prisma, "create_a");
    orgB = await createLeanFixture(db.prisma, "create_b");
  });

  afterAll(async () => db.stop());

  it("creates a structured hypothesis linked to its KeyResult and Objective", async () => {
    const result = await createExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        keyResultId: orgA.keyResultId,
        belief: "  una guía reduce fricción  ",
        expectedOutcome: "  más activaciones  ",
      },
      db.prisma,
    );

    const stored = await withTenant(
      orgA.organizationId,
      (tx) =>
        tx.experiment.findUniqueOrThrow({
          where: { id: result.experimentId },
          include: { hypothesis: true },
        }),
      db.prisma,
    );
    expect(stored).toMatchObject({ status: "Hypothesis", organizationId: orgA.organizationId });
    expect(stored.hypothesis).toMatchObject({
      belief: "una guía reduce fricción",
      expectedOutcome: "más activaciones",
      keyResultId: orgA.keyResultId,
      objectiveId: orgA.objectiveId,
    });
  });

  it("rejects missing and cross-Organization KeyResults", async () => {
    for (const keyResultId of ["", orgB.keyResultId]) {
      await expect(
        createExperiment(
          {
            actorClerkUserId: orgA.actorClerkUserId,
            keyResultId,
            belief: "belief",
            expectedOutcome: "outcome",
          },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "okrs/key-result-not-found" });
    }
  });

  it("groups only the tenant's cards in their persisted state", async () => {
    const own = await createExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        keyResultId: orgA.keyResultId,
        belief: "board belief",
        expectedOutcome: "board outcome",
      },
      db.prisma,
    );
    await createExperiment(
      {
        actorClerkUserId: orgB.actorClerkUserId,
        keyResultId: orgB.keyResultId,
        belief: "foreign belief",
        expectedOutcome: "foreign outcome",
      },
      db.prisma,
    );
    const board = await listExperimentBoard(
      { actorClerkUserId: orgA.actorClerkUserId },
      db.prisma,
    );
    expect(
      board.Hypothesis.find((card) => card.experimentId === own.experimentId),
    ).toMatchObject({
      statement: "We believe board belief → we expect board outcome",
      keyResultTitle: "KeyResult create_a",
      objectiveTitle: "Objective create_a",
    });
    expect(board.Hypothesis.some((card) => card.statement.includes("foreign belief"))).toBe(
      false,
    );
    expect(board.Building).toEqual([]);
    expect(board.Measuring).toEqual([]);
    expect(board.Learned).toEqual([]);
  });
});
