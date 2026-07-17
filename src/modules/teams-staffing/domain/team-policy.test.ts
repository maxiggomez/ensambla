import { describe, expect, it } from "vitest";

import { canCreateTeam, canManageProjects, canManageTeamMembers } from "./team-policy";

describe("team policy (MVP)", () => {
  it("Dirección and Líder can create teams; Colaborador cannot", () => {
    expect(canCreateTeam("Direccion")).toBe(true);
    expect(canCreateTeam("Lider")).toBe(true);
    expect(canCreateTeam("Colaborador")).toBe(false);
  });

  it("assignments: Dirección always; Líder only as Lead of that team; Colaborador never", () => {
    expect(canManageTeamMembers("Direccion", false)).toBe(true);
    expect(canManageTeamMembers("Lider", true)).toBe(true);
    expect(canManageTeamMembers("Lider", false)).toBe(false);
    expect(canManageTeamMembers("Colaborador", true)).toBe(false);
    expect(canManageTeamMembers("Colaborador", false)).toBe(false);
  });

  it("projects and objective links: Dirección or Líder", () => {
    expect(canManageProjects("Direccion")).toBe(true);
    expect(canManageProjects("Lider")).toBe(true);
    expect(canManageProjects("Colaborador")).toBe(false);
  });
});
