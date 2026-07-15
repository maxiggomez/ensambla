import type { Role } from "./roles";

/**
 * Role policy of identity-org (ORG-3): Dirección manages the organization and
 * its members; Líder and Colaborador cannot. (Team-scoped permissions for
 * Líder arrive with the teams/okrs capabilities.)
 */
export function canManageMembers(role: Role): boolean {
  return role === "Direccion";
}

export function canEditOrganization(role: Role): boolean {
  return role === "Direccion";
}
