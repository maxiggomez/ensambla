import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getFeedbackHealth } from "../../src/modules/feedback-growth/application";
import { launchPulse } from "../../src/modules/culture-enps/application";
import { getDashboard } from "../../src/modules/executive-dashboard/application";
import {
  closeExperiment,
  createExperiment,
  startBuilding,
  startMeasuring,
} from "../../src/modules/lean-experiments/application";
import { assignTeamMember, createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import { createLeanFixture, type LeanFixture } from "../helpers/lean-experiments";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("executive dashboard Organization isolation", () => {
  let db: TestDatabase;
  let organizationA: LeanFixture;
  let organizationB: LeanFixture;
  let teamAId: string;
  let teamBId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    organizationA = await createLeanFixture(db.prisma, "dashboard_tenant_a");
    organizationB = await createLeanFixture(db.prisma, "dashboard_tenant_b");
    teamAId = await createDashboardSignals(organizationA, "A");
    teamBId = await createDashboardSignals(organizationB, "B");
  });

  afterAll(async () => {
    await db.stop();
  });

  it("derives every metric and risk from the actor Organization only", async () => {
    const view = await getDashboard(
      { actorClerkUserId: organizationA.actorClerkUserId },
      db.prisma,
      { now: () => new Date("2026-08-15T00:00:00.000Z") },
    );
    expect(view.role).toBe("Direccion");
    if (view.role !== "Direccion") throw new Error("Expected Dirección view");
    expect(view.objectives.map((objective) => objective.id)).toEqual([
      organizationA.objectiveId,
    ]);
    expect(view.metrics).toMatchObject({
      okrs: { status: "ready", publishedObjectives: 1, progress: 0 },
      teams: { status: "ready", healthy: 0, total: 1 },
      culture: { status: "protected", minimumResponses: 4 },
      learning: { status: "ready", current: 1, previous: 0, change: 1 },
    });
    expect(view.teams.map((team) => team.teamId)).toEqual([teamAId]);
    expect(view.risks.map((risk) => risk.id)).toEqual([
      `key-result-alignment:${organizationA.keyResultId}`,
      `feedback-activity:${teamAId}`,
      `retrospective:${teamAId}`,
    ]);
    expect(JSON.stringify(view)).not.toContain(organizationB.objectiveId);
    expect(JSON.stringify(view)).not.toContain(organizationB.keyResultId);
    expect(JSON.stringify(view)).not.toContain(teamBId);
  });

  it("rejects a foreign Member in an aggregate Feedback-health group", async () => {
    await expect(
      getFeedbackHealth(
        {
          actorClerkUserId: organizationA.actorClerkUserId,
          since: new Date("2026-07-15T12:00:00.000Z"),
          groups: [
            {
              groupId: teamAId,
              memberIds: [organizationA.memberId, organizationB.memberId],
            },
          ],
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/member-not-found" });
  });

  async function createDashboardSignals(fixture: LeanFixture, suffix: string): Promise<string> {
    const { teamId } = await createTeam(
      {
        actorClerkUserId: fixture.actorClerkUserId,
        name: `Tenant dashboard Team ${suffix}`,
      },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: fixture.actorClerkUserId,
        teamId,
        memberId: fixture.memberId,
        role: "Lead",
        capacityPercent: 100,
      },
      db.prisma,
    );
    await launchPulse(
      { actorClerkUserId: fixture.actorClerkUserId, scope: { type: "organization" } },
      db.prisma,
    );
    const { experimentId } = await createExperiment(
      {
        actorClerkUserId: fixture.actorClerkUserId,
        keyResultId: fixture.keyResultId,
        belief: `belief ${suffix}`,
        expectedOutcome: `outcome ${suffix}`,
      },
      db.prisma,
    );
    await startBuilding(
      { actorClerkUserId: fixture.actorClerkUserId, experimentId },
      db.prisma,
    );
    await startMeasuring(
      {
        actorClerkUserId: fixture.actorClerkUserId,
        experimentId,
        measurement: { type: "percentage", start: 0, target: 100, current: 50 },
        cutoffAt: new Date("2026-08-31T00:00:00.000Z"),
      },
      db.prisma,
    );
    await closeExperiment(
      {
        actorClerkUserId: fixture.actorClerkUserId,
        experimentId,
        believed: `believed ${suffix}`,
        tested: `tested ${suffix}`,
        learned: `learned ${suffix}`,
        decision: "persevere",
      },
      db.prisma,
    );
    await withTenant(
      fixture.organizationId,
      (tx) =>
        tx.learning.updateMany({
          where: { experimentId },
          data: { createdAt: new Date("2026-08-14T12:00:00.000Z") },
        }),
      db.prisma,
    );
    return teamId;
  }
});
