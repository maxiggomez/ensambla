export type DashboardRole = "Direccion" | "Lider" | "Colaborador";

export interface DashboardTeamScopeFact {
  teamId: string;
  memberIds: readonly string[];
  leadMemberIds: readonly string[];
}

export interface DashboardScope {
  role: DashboardRole;
  actorMemberId: string;
  teamIds: string[];
}

export function deriveDashboardScope(
  role: DashboardRole,
  actorMemberId: string,
  teams: readonly DashboardTeamScopeFact[],
): DashboardScope {
  return {
    role,
    actorMemberId,
    teamIds:
      role === "Direccion"
        ? teams.map((team) => team.teamId)
        : role === "Lider"
          ? teams
              .filter((team) => team.leadMemberIds.includes(actorMemberId))
              .map((team) => team.teamId)
          : [],
  };
}

export function scopeTeamItems<T extends { teamId: string }>(
  scope: DashboardScope,
  items: readonly T[],
): T[] {
  if (scope.role === "Colaborador") return [];
  const teamIds = new Set(scope.teamIds);
  return items.filter((item) => teamIds.has(item.teamId));
}

export function scopeObjectives<T extends { ownerId: string; teamId: string | null }>(
  scope: DashboardScope,
  objectives: readonly T[],
): T[] {
  if (scope.role === "Direccion") return [...objectives];
  if (scope.role === "Colaborador") {
    return objectives.filter((objective) => objective.ownerId === scope.actorMemberId);
  }
  const teamIds = new Set(scope.teamIds);
  return objectives.filter(
    (objective) => objective.teamId !== null && teamIds.has(objective.teamId),
  );
}
