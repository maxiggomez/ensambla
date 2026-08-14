import { describe, expect, it } from "vitest";

import {
  getDashboard,
  type DashboardSources,
} from "../../src/modules/executive-dashboard/application";
import type { PrismaClient } from "../../src/shared/db";

const client = {} as PrismaClient;
const now = () => new Date("2026-08-14T12:00:00.000Z");

describe("role-scoped executive dashboard", () => {
  it("limits a Líder to Teams they lead and translates risks into actions", async () => {
    const sources = {
      listMembers: async () => [
        { id: "leader", clerkUserId: "leader-user", role: "Lider" as const },
        { id: "other", clerkUserId: "other-user", role: "Lider" as const },
      ],
      listObjectives: async () => [
        {
          id: "objective-a",
          title: "Objetivo A",
          status: "Published" as const,
          progress: 40,
          ownerId: "leader",
          teamId: "team-a",
          keyResults: [{ id: "kr-a", title: "KR A" }],
        },
        {
          id: "objective-b",
          title: "Objetivo B privado al otro Team",
          status: "Published" as const,
          progress: 10,
          ownerId: "other",
          teamId: "team-b",
          keyResults: [{ id: "kr-b", title: "KR B" }],
        },
      ],
      listTeamCapacities: async () => [
        { teamId: "team-a", name: "Team A", capacity: 120, overloaded: true },
        { teamId: "team-b", name: "Team B", capacity: 130, overloaded: true },
      ],
      listTeamAssignments: async (_actor: string, teamId: string) =>
        teamId === "team-a"
          ? [{ memberId: "leader", role: "Lead" as const, capacityPercent: 120 }]
          : [{ memberId: "other", role: "Lead" as const, capacityPercent: 130 }],
      evaluateLearningRisks: async () => [
        { teamId: "team-a", atRisk: false },
        { teamId: "team-b", atRisk: true },
      ],
      listPulseResults: async () => [],
      listLearnings: async () => [],
      evaluateAlignment: async () => ({
        projectsWithoutOkr: [],
        keyResultsWithoutProject: ["kr-a", "kr-b"],
      }),
      getFeedbackHealth: async (_actor: string, groups: readonly { groupId: string }[]) =>
        groups.map((group) => ({
          groupId: group.groupId,
          memberCount: 1,
          completedFeedbackCount: 1,
        })),
      listPrivateFeedback: async () => {
        throw new Error("Broader role must not request private Feedback");
      },
    } as unknown as DashboardSources;

    const view = await getDashboard({ actorClerkUserId: "leader-user" }, client, {
      now,
      sources,
    });
    expect(view.role).toBe("Lider");
    if (view.role !== "Lider") throw new Error("Expected Líder view");
    expect(view.teams.map((team) => team.teamId)).toEqual(["team-a"]);
    expect(view.objectives.map((objective) => objective.id)).toEqual(["objective-a"]);
    expect(view.risks.map((risk) => risk.id)).toEqual([
      "key-result-alignment:kr-a",
      "team-capacity:team-a",
    ]);
    expect(view.risks.every((risk) => risk.suggestedAction.length > 0)).toBe(true);
    expect(JSON.stringify(view)).not.toContain("Objetivo B privado");
  });

  it("returns a Colaborador personal summary without leaking Feedback bodies", async () => {
    const sources = {
      listMembers: async () => [
        { id: "collaborator", clerkUserId: "collaborator-user", role: "Colaborador" as const },
        { id: "other", clerkUserId: "other-user", role: "Colaborador" as const },
      ],
      listObjectives: async () => [
        {
          id: "mine",
          title: "Mi objetivo",
          status: "Published" as const,
          progress: 60,
          ownerId: "collaborator",
          teamId: null,
          keyResults: [],
        },
        {
          id: "other",
          title: "Objetivo ajeno",
          status: "Published" as const,
          progress: 30,
          ownerId: "other",
          teamId: null,
          keyResults: [],
        },
      ],
      listMemberLoads: async () => [
        { memberId: "collaborator", load: 80, overloaded: false },
        { memberId: "other", load: 120, overloaded: true },
      ],
      listPrivateFeedback: async () => [
        {
          feedbackId: "received",
          authorId: "other",
          recipientId: "collaborator",
          body: "Contenido privado recibido",
        },
        {
          feedbackId: "given",
          authorId: "collaborator",
          recipientId: "other",
          body: "Contenido privado enviado",
        },
      ],
      listFeedbackRequests: async () => ({
        inbox: [{ requestId: "pending", pending: true }],
        outbox: [],
      }),
      getGrowthPlan: async () => ({
        growthPlanId: "plan",
        nextMilestone: "Liderar una iniciativa",
        progress: 50,
        targets: [],
        evidence: [],
      }),
      listPendingPulses: async () => [{ id: "pulse" }],
    } as unknown as DashboardSources;

    const view = await getDashboard({ actorClerkUserId: "collaborator-user" }, client, {
      now,
      sources,
    });
    expect(view.role).toBe("Colaborador");
    if (view.role !== "Colaborador") throw new Error("Expected Colaborador view");
    expect(view.objectives.map((objective) => objective.id)).toEqual(["mine"]);
    expect(view.load).toEqual({ load: 80, overloaded: false });
    expect(view.feedback).toEqual({ received: 1, given: 1, pendingRequests: 1 });
    expect(view.growthPlan).toMatchObject({ nextMilestone: "Liderar una iniciativa" });
    expect(view.pendingPulses).toHaveLength(1);
    expect(JSON.stringify(view)).not.toContain("Contenido privado");
    expect(JSON.stringify(view)).not.toContain("Objetivo ajeno");
  });
});
