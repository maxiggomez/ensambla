import { describe, expect, it } from "vitest";

import { canCreateObjective, canEditObjective } from "./objective-policy";

describe("objective policy (MVP, sin Teams todavía)", () => {
  it("Company level is restricted to Dirección", () => {
    expect(canCreateObjective("Direccion", "Company")).toBe(true);
    expect(canCreateObjective("Lider", "Company")).toBe(false);
    expect(canCreateObjective("Colaborador", "Company")).toBe(false);
  });

  it("Area and Team levels require Dirección or Líder", () => {
    for (const level of ["Area", "Team"] as const) {
      expect(canCreateObjective("Direccion", level)).toBe(true);
      expect(canCreateObjective("Lider", level)).toBe(true);
      expect(canCreateObjective("Colaborador", level)).toBe(false);
    }
  });

  it("Person level is open to any role", () => {
    expect(canCreateObjective("Direccion", "Person")).toBe(true);
    expect(canCreateObjective("Lider", "Person")).toBe(true);
    expect(canCreateObjective("Colaborador", "Person")).toBe(true);
  });

  it("an objective is editable by its owner or by Dirección", () => {
    expect(canEditObjective("Colaborador", true)).toBe(true);
    expect(canEditObjective("Lider", true)).toBe(true);
    expect(canEditObjective("Direccion", false)).toBe(true);
    expect(canEditObjective("Lider", false)).toBe(false);
    expect(canEditObjective("Colaborador", false)).toBe(false);
  });
});
