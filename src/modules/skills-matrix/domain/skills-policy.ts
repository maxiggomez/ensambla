/** Réplica local del rol organizacional (domain/ es puro; ver okrs). */
export type Role = "Direccion" | "Lider" | "Colaborador";

/** Definir skills, setear competencias y requirements: Dirección o Líder. */
export function canManageSkills(role: Role): boolean {
  return role === "Direccion" || role === "Lider";
}
