import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = ["page.tsx", "teams-forms.tsx", "loading.tsx", "error.tsx"];

describe("Teams & Projects UI design-system contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("replaces the placeholder with the complete Spanish Teams & Projects UI", () => {
    expect(sources).not.toContain("UnderConstruction");
    expect(sources).toContain("Crear equipo");
    expect(sources).toContain("Asignar miembro");
    expect(sources).toContain("Cerrar proyecto");
    expect(sources).toContain("Alertas de alineamiento");
    expect(sources).toContain("Capacidad");
  });

  it("provides empty, loading and error guidance", () => {
    expect(sources).toContain("Creá tu primer equipo");
    expect(sources).toContain("Cargando equipos y proyectos");
    expect(sources).toContain("No pudimos cargar los equipos y proyectos");
  });

  it("uses labelled controls without hardcoded colors", () => {
    expect(sources).toContain("<Label");
    expect(sources).toContain("<fieldset");
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });

  it("consumes the public application contracts without re-implementing them", () => {
    const actions = readFileSync(join(__dirname, "actions.ts"), "utf8");
    expect(actions).toContain("createTeam");
    expect(actions).toContain("assignTeamMember");
    expect(actions).toContain("linkProjectToObjectives");
    expect(actions).toContain("closeProject");
    expect(actions).not.toContain('from "./domain');
  });
});
