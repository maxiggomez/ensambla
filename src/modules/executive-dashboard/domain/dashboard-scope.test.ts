import { describe, expect, it } from "vitest";

import { deriveDashboardScope, scopeObjectives, scopeTeamItems } from "./dashboard-scope";

const teams = [
  { teamId: "team-a", memberIds: ["leader", "collaborator"], leadMemberIds: ["leader"] },
  { teamId: "team-b", memberIds: ["other"], leadMemberIds: ["other"] },
];

const objectives = [
  { id: "company", ownerId: "other", teamId: null },
  { id: "team-a-objective", ownerId: "other", teamId: "team-a" },
  { id: "team-b-objective", ownerId: "other", teamId: "team-b" },
  { id: "personal", ownerId: "collaborator", teamId: null },
];

describe("dashboard role scope", () => {
  it("keeps the full Organization scope for Dirección", () => {
    const scope = deriveDashboardScope("Direccion", "director", teams);
    expect(scope).toEqual({
      role: "Direccion",
      actorMemberId: "director",
      teamIds: ["team-a", "team-b"],
    });
    expect(scopeObjectives(scope, objectives).map((objective) => objective.id)).toEqual([
      "company",
      "team-a-objective",
      "team-b-objective",
      "personal",
    ]);
  });

  it("keeps only Teams led by the Líder and their objectives", () => {
    const scope = deriveDashboardScope("Lider", "leader", teams);
    expect(scope.teamIds).toEqual(["team-a"]);
    expect(scopeTeamItems(scope, [{ teamId: "team-a" }, { teamId: "team-b" }])).toEqual([
      { teamId: "team-a" },
    ]);
    expect(scopeObjectives(scope, objectives).map((objective) => objective.id)).toEqual([
      "team-a-objective",
    ]);
  });

  it("keeps only the Colaborador's personal objectives", () => {
    const scope = deriveDashboardScope("Colaborador", "collaborator", teams);
    expect(scope.teamIds).toEqual([]);
    expect(scopeObjectives(scope, objectives).map((objective) => objective.id)).toEqual([
      "personal",
    ]);
  });
});
