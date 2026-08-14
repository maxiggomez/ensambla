import { describe, expect, it } from "vitest";

import { buildConsolidatedMetrics, evaluateDashboardRisks } from "./dashboard-policy";

const now = new Date("2026-08-14T12:00:00.000Z");

describe("executive dashboard metrics", () => {
  it("uses published derived progress and healthy non-empty Teams", () => {
    const metrics = buildConsolidatedMetrics({
      now,
      objectives: [
        { status: "Published", progress: 30 },
        { status: "Published", progress: 70 },
        { status: "Draft", progress: 100 },
      ],
      teams: [
        { teamId: "healthy", memberCount: 2, overloaded: false },
        { teamId: "overloaded", memberCount: 2, overloaded: true },
        { teamId: "late", memberCount: 1, overloaded: false },
        { teamId: "empty", memberCount: 0, overloaded: false },
      ],
      retrospectiveRisks: [{ teamId: "late", atRisk: true }],
      culture: { status: "visible", score: 25, participation: 80 },
      learnings: [],
    });

    expect(metrics.okrs).toEqual({
      status: "ready",
      publishedObjectives: 2,
      progress: 50,
    });
    expect(metrics.teams).toEqual({ status: "ready", healthy: 1, total: 4 });
    expect(metrics.culture).toEqual({ status: "visible", score: 25, participation: 80 });
  });

  it("uses fixed trailing and preceding 30-day learning windows", () => {
    const metrics = buildConsolidatedMetrics({
      now,
      objectives: [],
      teams: [],
      retrospectiveRisks: [],
      culture: null,
      learnings: [
        { createdAt: new Date("2026-08-14T11:00:00.000Z") },
        { createdAt: new Date("2026-07-15T12:00:00.000Z") },
        { createdAt: new Date("2026-07-15T11:59:59.999Z") },
        { createdAt: new Date("2026-06-15T12:00:00.000Z") },
        { createdAt: new Date("2026-06-15T11:59:59.999Z") },
      ],
    });

    expect(metrics.learning).toEqual({ status: "ready", current: 2, previous: 2, change: 0 });
  });

  it("keeps protected and empty states explicit", () => {
    const protectedMetrics = buildConsolidatedMetrics({
      now,
      objectives: [],
      teams: [],
      retrospectiveRisks: [],
      culture: { status: "suppressed", minimumResponses: 4 },
      learnings: [],
    });

    expect(protectedMetrics.okrs).toEqual({ status: "empty" });
    expect(protectedMetrics.teams).toEqual({ status: "empty" });
    expect(protectedMetrics.culture).toEqual({ status: "protected", minimumResponses: 4 });
    expect(protectedMetrics.learning).toEqual({ status: "empty" });
  });
});

describe("executive dashboard risks", () => {
  const facts = {
    keyResultsWithoutProject: [{ keyResultId: "kr-2", title: "Retención" }],
    teams: [
      { teamId: "team-b", name: "Growth", capacity: 120, overloaded: true },
      { teamId: "team-a", name: "Producto", capacity: 80, overloaded: false },
    ],
    retrospectiveRisks: [{ teamId: "team-a", atRisk: true }],
    feedbackHealth: [
      { groupId: "team-a", memberCount: 2, completedFeedbackCount: 0 },
      { groupId: "empty", memberCount: 0, completedFeedbackCount: 0 },
    ],
  } as const;

  it("generates stable suggested alerts in deterministic priority order", () => {
    const risks = evaluateDashboardRisks(facts);

    expect(risks.map(({ id, kind, severity }) => ({ id, kind, severity }))).toEqual([
      {
        id: "key-result-alignment:kr-2",
        kind: "key-result-alignment",
        severity: "critical",
      },
      { id: "team-capacity:team-b", kind: "team-capacity", severity: "critical" },
      { id: "feedback-activity:team-a", kind: "feedback-activity", severity: "attention" },
      { id: "retrospective:team-a", kind: "retrospective", severity: "attention" },
    ]);
    expect(risks.every((risk) => risk.suggestedAction.length > 0)).toBe(true);
  });

  it("removes the stable risk when its source fact is resolved", () => {
    const before = evaluateDashboardRisks(facts);
    const after = evaluateDashboardRisks({
      ...facts,
      teams: facts.teams.map((team) =>
        team.teamId === "team-b" ? { ...team, capacity: 100, overloaded: false } : team,
      ),
    });

    expect(before.map((risk) => risk.id)).toContain("team-capacity:team-b");
    expect(after.map((risk) => risk.id)).not.toContain("team-capacity:team-b");
  });
});
