import { describe, expect, it } from "vitest";

import {
  getDashboard,
  type DashboardSources,
} from "../../src/modules/executive-dashboard/application";
import type { PrismaClient } from "../../src/shared/db";

const client = {} as PrismaClient;

describe("Dirección executive dashboard", () => {
  it("recomputes consolidated metrics and live prioritized risks from source projections", async () => {
    let progress = 25;
    let unaligned = true;
    const sources = {
      listMembers: async () => [
        { id: "director", clerkUserId: "direction", role: "Direccion" as const },
      ],
      listObjectives: async () => [
        {
          id: "objective",
          title: "Crecimiento",
          status: "Published" as const,
          progress,
          ownerId: "director",
          teamId: null,
          keyResults: [{ id: "kr", title: "MRR" }],
        },
      ],
      listTeamCapacities: async () => [
        { teamId: "team", name: "Growth", capacity: 120, overloaded: true },
      ],
      listTeamAssignments: async () => [
        { memberId: "director", role: "Lead" as const, capacityPercent: 120 },
      ],
      evaluateLearningRisks: async () => [{ teamId: "team", atRisk: true }],
      listPulseResults: async () => [
        {
          pulseId: "pulse",
          scope: { type: "organization" as const },
          result: { status: "suppressed" as const, minimumResponses: 4 },
        },
      ],
      listLearnings: async () => [{ createdAt: new Date("2026-08-01T00:00:00.000Z") }],
      evaluateAlignment: async () => ({
        projectsWithoutOkr: [],
        keyResultsWithoutProject: unaligned ? ["kr"] : [],
      }),
      getFeedbackHealth: async () => [
        { groupId: "team", memberCount: 1, completedFeedbackCount: 0 },
      ],
    } as unknown as DashboardSources;

    const first = await getDashboard({ actorClerkUserId: "direction" }, client, {
      now: () => new Date("2026-08-14T12:00:00.000Z"),
      sources,
    });
    expect(first.role).toBe("Direccion");
    if (first.role !== "Direccion") throw new Error("Expected Dirección view");
    expect(first.metrics).toMatchObject({
      okrs: { status: "ready", publishedObjectives: 1, progress: 25 },
      teams: { status: "ready", healthy: 0, total: 1 },
      culture: { status: "protected", minimumResponses: 4 },
      learning: { status: "ready", current: 1, previous: 0, change: 1 },
    });
    expect(first.risks.map((risk) => risk.id)).toEqual([
      "key-result-alignment:kr",
      "team-capacity:team",
      "feedback-activity:team",
      "retrospective:team",
    ]);

    progress = 75;
    unaligned = false;
    const refreshed = await getDashboard({ actorClerkUserId: "direction" }, client, {
      now: () => new Date("2026-08-14T12:00:00.000Z"),
      sources,
    });
    if (refreshed.role !== "Direccion") throw new Error("Expected Dirección view");
    expect(refreshed.metrics.okrs).toMatchObject({ progress: 75 });
    expect(refreshed.risks.map((risk) => risk.id)).not.toContain("key-result-alignment:kr");
  });
});
