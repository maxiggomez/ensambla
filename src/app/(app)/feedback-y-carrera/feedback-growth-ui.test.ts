import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const route = (file: string): string =>
  readFileSync(new URL(`./${file}`, import.meta.url), "utf8");

describe("Feedback & Carrera UI", () => {
  it("renders private Feedback, requests, public Kudos and GrowthPlan progress", () => {
    const page = route("page.tsx");
    expect(page).toContain("Feedback & Carrera");
    expect(page).toContain("Feedback para mí");
    expect(page).toContain("Solicitudes pendientes");
    expect(page).toContain("Reconocimientos del equipo");
    expect(page).toContain("Mi plan de crecimiento");
    expect(page).toContain("Próximo hito");
    expect(page).toContain("Gap");
    expect(page).toContain("aria-labelledby");
    expect(page).not.toContain("UnderConstruction");
  });

  it("provides labelled keyboard-accessible forms and Spanish feedback", () => {
    const forms = route("feedback-growth-forms.tsx");
    const actions = route("actions.ts");
    expect(forms).toContain("<Label");
    expect(forms).toContain("<fieldset");
    expect(forms).toContain("aria-live");
    expect(forms).toContain("focus-visible:ring");
    expect(actions).toContain("No se pudo completar la acción");
    expect(route("loading.tsx")).toContain("Cargando Feedback & Carrera");
    expect(route("error.tsx")).toContain("No pudimos cargar Feedback & Carrera");
  });

  it("uses Radar tokens without ad-hoc colors", () => {
    const sources = ["page.tsx", "feedback-growth-forms.tsx", "loading.tsx", "error.tsx"]
      .map(route)
      .join("\n");
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });
});
