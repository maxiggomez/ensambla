import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = [
  "page.tsx",
  "north-star-form.tsx",
  "lever-form.tsx",
  "strategy-form.tsx",
  "pillar-form.tsx",
];

describe("Norte Estratégico UI design-system contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("replaces the placeholder with the complete Spanish strategy UI", () => {
    expect(sources).not.toContain("UnderConstruction");
    expect(sources).toContain("De dónde baja todo lo demás");
    expect(sources).toContain("North Star");
    expect(sources).toContain("Definir North Star");
    expect(sources).toContain("Agregar lever");
    expect(sources).toContain("Guardar estrategia");
    expect(sources).toContain("Crear pilar");
  });

  it("uses labelled controls without hardcoded colors", () => {
    expect(sources).toContain("<Label");
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });

  it("triggers North Star and lever creation from drawers next to their titles", () => {
    const page = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(page).toContain("<EntityCreateDrawer");
    expect(page).toContain('triggerLabel="+ Nueva North Star"');
    expect(page).toContain('title="Definir North Star"');
    expect(page).toContain('triggerLabel="+ Nuevo lever"');
    expect(page).toContain('title="Nuevo lever"');
    expect(page).toContain("<NorthStarForm");
    expect(page).toContain("<LeverForm");
  });
});
