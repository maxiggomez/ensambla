import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const route = (file: string): string =>
  readFileSync(new URL(`./${file}`, import.meta.url), "utf8");

describe("Executive Dashboard UI", () => {
  it("renders the three Spanish role projections and actionable risk states", () => {
    const page = route("page.tsx");
    expect(page).toContain("Panorama de la organización");
    expect(page).toContain("Tu Team en foco");
    expect(page).toContain("Tu panorama personal");
    expect(page).toContain("Riesgos de desalineamiento");
    expect(page).toContain("Acción sugerida");
    expect(page).toContain("Mis objetivos");
    expect(page).toContain("Mi carga");
    expect(page).toContain("Mi Feedback");
    expect(page).toContain("Mi plan de crecimiento");
    expect(page).toContain("Pulsos pendientes");
  });

  it("represents protected, empty, loading and error states accessibly", () => {
    const page = route("page.tsx");
    expect(page).toContain("Resultado protegido");
    expect(page).toContain("Sin datos todavía");
    expect(page).toContain("aria-labelledby");
    expect(page).toContain('role="status"');
    expect(route("loading.tsx")).toContain('aria-busy="true"');
    expect(route("loading.tsx")).toContain("Cargando dashboard");
    expect(route("error.tsx")).toContain("No pudimos cargar el dashboard");
    expect(route("error.tsx")).toContain("Reintentar");
  });

  it("depends on one dashboard application contract and uses Radar tokens", () => {
    const sources = ["page.tsx", "loading.tsx", "error.tsx"].map(route).join("\n");
    expect(route("page.tsx")).toContain('from "@/modules/executive-dashboard/application"');
    expect(route("page.tsx")).not.toMatch(/@\/modules\/(?!executive-dashboard)/);
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });
});
