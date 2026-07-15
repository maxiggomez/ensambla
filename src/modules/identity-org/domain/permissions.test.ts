import { describe, expect, it } from "vitest";

import { canEditOrganization, canManageMembers } from "./permissions";

describe("role permissions (ORG-3)", () => {
  it("only Dirección can manage members", () => {
    expect(canManageMembers("Direccion")).toBe(true);
    expect(canManageMembers("Lider")).toBe(false);
    expect(canManageMembers("Colaborador")).toBe(false);
  });

  it("only Dirección can edit the organization", () => {
    expect(canEditOrganization("Direccion")).toBe(true);
    expect(canEditOrganization("Lider")).toBe(false);
    expect(canEditOrganization("Colaborador")).toBe(false);
  });
});
