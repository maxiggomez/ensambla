export type OrganizationRole = "Direccion" | "Lider" | "Colaborador";

export function canManagePulses(role: OrganizationRole): boolean {
  return role === "Direccion";
}
