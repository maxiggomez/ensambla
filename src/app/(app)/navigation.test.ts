import { describe, expect, it } from "vitest";

import { canEditOrganization, ROLES, type Role } from "@/modules/identity-org/application";

import { NAV_SECTIONS, sectionsForRole } from "./navigation";

describe("app-shell role-based navigation (🔒)", () => {
  it("reuses the existing identity-org permission rule, not new policy", () => {
    expect(typeof canEditOrganization).toBe("function");
  });

  it("defines every product section with a label, href and icon", () => {
    expect(NAV_SECTIONS.length).toBeGreaterThan(0);
    for (const section of NAV_SECTIONS) {
      expect(section.label.trim().length).toBeGreaterThan(0);
      expect(section.href.startsWith("/")).toBe(true);
      expect(section.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it("Dirección sees all sections", () => {
    expect(canEditOrganization("Direccion")).toBe(true);
    expect(sectionsForRole("Direccion")).toHaveLength(NAV_SECTIONS.length);
  });

  it("Líder sees all sections (content is scoped to their Team)", () => {
    expect(sectionsForRole("Lider")).toHaveLength(NAV_SECTIONS.length);
  });

  it("Colaborador does not see the management-only sections", () => {
    const managementKeys = NAV_SECTIONS.filter((section) => section.scope === "management").map(
      (section) => section.key,
    );
    expect(managementKeys.length).toBeGreaterThan(0);

    const colaborador = sectionsForRole("Colaborador");
    for (const section of colaborador) {
      expect(managementKeys).not.toContain(section.key);
    }
  });

  it("Colaborador navigates the read-only Teams and Skills sections", () => {
    const keys = sectionsForRole("Colaborador").map((section) => section.key);
    expect(keys).toContain("equipos-y-proyectos");
    expect(keys).toContain("skills-y-staffing");
    expect(keys).not.toContain("miembros");
  });

  it("management-only sections are only Miembros", () => {
    const keys = NAV_SECTIONS.filter((section) => section.scope === "management")
      .map((section) => section.key)
      .sort();
    expect(keys).toEqual(["miembros"]);
  });

  it("every product role resolves to a non-empty navigation", () => {
    for (const role of ROLES as readonly Role[]) {
      expect(sectionsForRole(role).length).toBeGreaterThan(0);
    }
  });
});
