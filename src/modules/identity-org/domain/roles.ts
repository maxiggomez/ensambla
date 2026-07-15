/**
 * Roles of the ubiquitous language (project.md). String values match the
 * `MemberRole` enum persisted by Prisma so no mapping layer is needed, but
 * the domain owns the concept and stays free of infrastructure imports.
 */
export const ROLES = ["Direccion", "Lider", "Colaborador"] as const;
export type Role = (typeof ROLES)[number];
