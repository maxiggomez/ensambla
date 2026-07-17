import type { ObjectiveLevel, ObjectiveStatus } from "./objective";

/**
 * Réplica local del rol del lenguaje ubicuo: domain/ es puro y no puede
 * importar de otro módulo. TypeScript verifica la compatibilidad estructural
 * en cada call site (application pasa el `Role` real de identity-org).
 */
export type Role = "Direccion" | "Lider" | "Colaborador";

/**
 * Política MVP (sin Teams todavía; coherente con ORG-3 "Colaborador cannot
 * edit company objectives"). Se refinará cuando exista `teams-staffing`.
 */
export function canCreateObjective(role: Role, level: ObjectiveLevel): boolean {
  switch (level) {
    case "Company":
      return role === "Direccion";
    case "Area":
    case "Team":
      return role === "Direccion" || role === "Lider";
    case "Person":
      return true;
  }
}

export function canEditObjective(role: Role, isOwner: boolean): boolean {
  return isOwner || role === "Direccion";
}

/** Los publicados los ve toda la Organización; los drafts, su owner o Dirección. */
export function canViewObjective(
  role: Role,
  isOwner: boolean,
  status: ObjectiveStatus,
): boolean {
  return status === "Published" || canEditObjective(role, isOwner);
}
