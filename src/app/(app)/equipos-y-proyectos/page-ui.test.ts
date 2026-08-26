import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = ["page.tsx", "teams-forms.tsx"];

describe("Equipos & Proyectos entity-create drawer contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("adopts the entity-create drawer for team and project creation", () => {
    expect(sources).toContain("+ Nuevo equipo");
    expect(sources).toContain("+ Nuevo proyecto");
    expect(sources).toContain("EntityCreateDrawer");
    expect(sources).not.toMatch(/CardTitle>Crear equipo/);
    expect(sources).not.toMatch(/CardTitle>Crear proyecto/);
    expect(sources).toContain('role="status"');
  });

  it("keeps inline editing inside the Team card", () => {
    expect(sources).toContain("Editar equipo");
    expect(sources).toContain("Guardar cambios");
  });
});
