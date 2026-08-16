import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = ["page.tsx", "rituals-forms.tsx", "loading.tsx", "error.tsx"];

describe("Rituals UI design-system contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("replaces the placeholder with the complete Spanish Rituals UI", () => {
    expect(sources).not.toContain("UnderConstruction");
    expect(sources).toContain("Rituales y blockers");
    expect(sources).toContain("Crear ceremonia");
    expect(sources).toContain("Marcar realizada");
    expect(sources).toContain("Tablero de bloqueos");
    expect(sources).toContain("Resolver");
    expect(sources).toContain("Registrar retrospectiva");
  });

  it("provides empty, loading and error guidance", () => {
    expect(sources).toContain("Todavía no hay ceremonias definidas");
    expect(sources).toContain("No hay bloqueos abiertos");
    expect(sources).toContain("Cargando rituales");
    expect(sources).toContain("No pudimos cargar los rituales");
  });

  it("uses labelled controls without hardcoded colors", () => {
    expect(sources).toContain("<Label");
    expect(sources).toContain("<fieldset");
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });

  it("consumes the public application contracts without re-implementing them", () => {
    const actions = readFileSync(join(__dirname, "actions.ts"), "utf8");
    expect(actions).toContain("createRitual");
    expect(actions).toContain("generateRitualOccurrences");
    expect(actions).toContain("evaluateRitualStatus");
    expect(actions).toContain("markRitualHeld");
    expect(actions).toContain("recordBlocker");
    expect(actions).toContain("resolveBlocker");
    expect(actions).toContain("recordRetrospective");
    expect(actions).not.toContain('from "./domain');
  });
});
