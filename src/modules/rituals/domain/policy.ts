/**
 * Réplica local del rol organizacional (domain/ es puro; patrón de
 * teams-staffing/domain/team-policy.ts). MVP: Dirección y Líder administran
 * ceremonias, bloqueos y retrospectivas; Colaborador solo lectura.
 */
export type Role = "Direccion" | "Lider" | "Colaborador";

export function canManageRituals(role: Role): boolean {
  return role === "Direccion" || role === "Lider";
}
