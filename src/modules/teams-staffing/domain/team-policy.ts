/**
 * Réplica local del rol organizacional (domain/ es puro; ver okrs). MVP:
 * Dirección administra todo; Líder crea Teams/Projects y administra los Teams
 * donde es Lead; Colaborador solo lectura.
 */
export type Role = "Direccion" | "Lider" | "Colaborador";

export function canCreateTeam(role: Role): boolean {
  return role === "Direccion" || role === "Lider";
}

export function canManageTeamMembers(role: Role, isTeamLead: boolean): boolean {
  return role === "Direccion" || (role === "Lider" && isTeamLead);
}

export function canManageProjects(role: Role): boolean {
  return role === "Direccion" || role === "Lider";
}
