import { describe, expect, it } from "vitest";

import { SECTIONS, sectionsForRole } from "./sections";

describe("sectionsForRole", () => {
  it("Dirección ve todas las secciones, incluida Miembros", () => {
    const labels = sectionsForRole("Direccion").map((section) => section.label);
    expect(labels).toContain("Miembros");
    expect(sectionsForRole("Direccion")).toHaveLength(SECTIONS.length);
  });

  it("Líder y Colaborador ven todas las secciones excepto la de gestión (Miembros)", () => {
    for (const role of ["Lider", "Colaborador"] as const) {
      const labels = sectionsForRole(role).map((section) => section.label);
      expect(labels).not.toContain("Miembros");
      expect(labels).toContain("Dashboard");
      expect(labels).toContain("Norte estratégico");
      expect(sectionsForRole(role)).toHaveLength(SECTIONS.length - 1);
    }
  });

  it("cada sección tiene href único y label no vacío", () => {
    const hrefs = SECTIONS.map((section) => section.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const section of SECTIONS) {
      expect(section.label.trim()).not.toBe("");
      expect(section.href.startsWith("/")).toBe(true);
    }
  });

  it("el registro es serializable (sin funciones) para cruzar servidor → cliente", () => {
    for (const section of sectionsForRole("Direccion")) {
      expect(typeof section.slug).toBe("string");
      expect(typeof section.label).toBe("string");
      expect(typeof section.href).toBe("string");
      expect(
        section.managementOnly === undefined || typeof section.managementOnly === "boolean",
      ).toBe(true);
    }
  });
});
