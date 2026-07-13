import type { Role } from "./roles";

/**
 * Invariant: an organization must always keep at least one Dirección member,
 * otherwise nobody can manage members or the organization (permanent lockout).
 */
export function leavesOrgWithoutDireccion(
  currentRole: Role,
  newRole: Role,
  direccionCount: number,
): boolean {
  return currentRole === "Direccion" && newRole !== "Direccion" && direccionCount <= 1;
}
