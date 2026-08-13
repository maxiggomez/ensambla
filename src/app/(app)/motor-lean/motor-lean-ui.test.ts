import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const route = (file: string): string =>
  readFileSync(new URL(`./${file}`, import.meta.url), "utf8");

describe("Motor Lean UI", () => {
  it("renders an accessible four-column lifecycle board and learning library", () => {
    const page = route("page.tsx");
    expect(page).toContain("Motor Lean");
    expect(page).toContain("Hipótesis");
    expect(page).toContain("Construyendo");
    expect(page).toContain("Midiendo");
    expect(page).toContain("Aprendido");
    expect(page).toContain("Biblioteca de aprendizajes");
    expect(page).toContain("aria-labelledby");
    expect(page).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it("provides labelled forms, Spanish feedback and route states", () => {
    const forms = route("experiment-forms.tsx");
    const actions = route("actions.ts");
    expect(forms).toContain("htmlFor");
    expect(forms).toContain("aria-live");
    expect(actions).toContain("No se pudo completar la acción");
    expect(route("loading.tsx")).toContain("Cargando Motor Lean");
    expect(route("error.tsx")).toContain("No pudimos cargar Motor Lean");
  });
});
