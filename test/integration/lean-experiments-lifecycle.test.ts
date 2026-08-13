import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  closeExperiment,
  createExperiment,
  listExperimentBoard,
  startBuilding,
  startMeasuring,
} from "../../src/modules/lean-experiments/application";
import { inviteMember } from "../../src/modules/identity-org/application";
import { addKeyResult, createObjective } from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { Measurement } from "../../src/shared/measurement";
import { createLeanFixture, type LeanFixture } from "../helpers/lean-experiments";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

const measurements: Measurement[] = [
  { type: "check", done: false },
  { type: "percentage", start: 0, target: 50, current: 10 },
  { type: "integer", start: 0, target: 100, current: 20 },
  { type: "currency", start: 100, target: 1000, current: 250 },
  { type: "text", state: "in_progress" },
];

describe("Lean experiment lifecycle", () => {
  let db: TestDatabase;
  let orgA: LeanFixture;
  let orgB: LeanFixture;
  let privateExperimentId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await createLeanFixture(db.prisma, "life_a");
    orgB = await createLeanFixture(db.prisma, "life_b");
    await inviteMember(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        email: "private-viewer@lean.test",
        name: "Private viewer",
        role: "Colaborador",
      },
      db.prisma,
    );
    await withTenant(
      orgA.organizationId,
      (tx) =>
        tx.member.update({
          where: {
            organizationId_email: {
              organizationId: orgA.organizationId,
              email: "private-viewer@lean.test",
            },
          },
          data: { clerkUserId: "lean_private_viewer" },
        }),
      db.prisma,
    );
    const draft = await createObjective(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        title: "Private draft",
        level: "Company",
        ownerMemberId: orgA.memberId,
      },
      db.prisma,
    );
    const privateKr = await addKeyResult(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        objectiveId: draft.objectiveId,
        title: "Private KR",
        measurementType: "check",
      },
      db.prisma,
    );
    ({ experimentId: privateExperimentId } = await createExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        keyResultId: privateKr.keyResultId,
        belief: "private belief",
        expectedOutcome: "private outcome",
      },
      db.prisma,
    ));
  });

  afterAll(async () => db.stop());

  async function newExperiment(): Promise<string> {
    const result = await createExperiment(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        keyResultId: orgA.keyResultId,
        belief: "belief",
        expectedOutcome: "outcome",
      },
      db.prisma,
    );
    return result.experimentId;
  }

  it.each(measurements)(
    "persists a $type metric when entering Measuring",
    async (measurement) => {
      const experimentId = await newExperiment();
      await startBuilding({ actorClerkUserId: orgA.actorClerkUserId, experimentId }, db.prisma);
      await startMeasuring(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          experimentId,
          measurement,
          cutoffAt: new Date("2026-09-30T00:00:00Z"),
        },
        db.prisma,
      );
      const board = await listExperimentBoard(
        { actorClerkUserId: orgA.actorClerkUserId },
        db.prisma,
      );
      expect(board.Measuring.find((card) => card.experimentId === experimentId)).toMatchObject({
        status: "Measuring",
        cutoffAt: new Date("2026-09-30T00:00:00Z"),
        measurement,
      });
    },
  );

  it("rejects skipped, repeated and incomplete transitions", async () => {
    const experimentId = await newExperiment();
    await expect(
      startMeasuring(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          experimentId,
          measurement: measurements[0]!,
          cutoffAt: new Date(),
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "lean-experiments/invalid-transition" });
    await startBuilding({ actorClerkUserId: orgA.actorClerkUserId, experimentId }, db.prisma);
    await expect(
      startBuilding({ actorClerkUserId: orgA.actorClerkUserId, experimentId }, db.prisma),
    ).rejects.toMatchObject({ code: "lean-experiments/invalid-transition" });
    await expect(
      startMeasuring(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          experimentId,
          measurement: undefined,
          cutoffAt: new Date(),
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "lean-experiments/measurement-required" });
  });

  it("allows only one of two stale concurrent transitions", async () => {
    const experimentId = await newExperiment();
    const settled = await Promise.allSettled([
      startBuilding({ actorClerkUserId: orgA.actorClerkUserId, experimentId }, db.prisma),
      startBuilding({ actorClerkUserId: orgA.actorClerkUserId, experimentId }, db.prisma),
    ]);
    expect(settled.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(settled.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("cannot transition another Organization's experiment", async () => {
    const foreign = await createExperiment(
      {
        actorClerkUserId: orgB.actorClerkUserId,
        keyResultId: orgB.keyResultId,
        belief: "foreign",
        expectedOutcome: "foreign",
      },
      db.prisma,
    );
    await expect(
      startBuilding(
        { actorClerkUserId: orgA.actorClerkUserId, experimentId: foreign.experimentId },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "lean-experiments/experiment-not-found" });
  });

  it("cannot transition an experiment whose KeyResult is not visible in the same tenant", async () => {
    await expect(
      startBuilding(
        { actorClerkUserId: "lean_private_viewer", experimentId: privateExperimentId },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/key-result-not-found" });
  });

  it("cannot close an experiment whose KeyResult is not visible in the same tenant", async () => {
    await startBuilding(
      { actorClerkUserId: orgA.actorClerkUserId, experimentId: privateExperimentId },
      db.prisma,
    );
    await startMeasuring(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        experimentId: privateExperimentId,
        measurement: { type: "check", done: true },
        cutoffAt: new Date("2026-09-30T00:00:00Z"),
      },
      db.prisma,
    );
    await expect(
      closeExperiment(
        {
          actorClerkUserId: "lean_private_viewer",
          experimentId: privateExperimentId,
          believed: "belief",
          tested: "test",
          learned: "learning",
          decision: "pivot",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/key-result-not-found" });
  });
});
