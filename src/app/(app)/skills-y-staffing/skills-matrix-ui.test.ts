import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = ["page.tsx", "skills-forms.tsx", "loading.tsx", "error.tsx"];

describe("Skills & Staffing UI design-system contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("replaces the placeholder with the complete Spanish Skills & Staffing UI", () => {
    expect(sources).not.toContain("UnderConstruction");
    expect(sources).toContain("Competencias y staffing alineados");
    expect(sources).toContain("Matriz de competencias");
    expect(sources).toContain("Definir skill");
    expect(sources).toContain("Sugerencias de staffing");
    expect(sources).toContain("Gaps de cobertura");
    expect(sources).toContain("Riesgo bus factor");
  });

  it("provides empty, loading and error guidance", () => {
    expect(sources).toContain("Todavía no hay skills definidas");
    expect(sources).toContain("Cargando skills y staffing");
    expect(sources).toContain("No pudimos cargar la matriz de skills");
  });

  it("uses labelled controls without hardcoded colors", () => {
    expect(sources).toContain("<Label");
    expect(sources).toContain("<fieldset");
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });

  it("consumes the public application contracts without re-implementing them", () => {
    const actions = readFileSync(join(__dirname, "actions.ts"), "utf8");
    expect(actions).toContain("defineSkill");
    expect(actions).toContain("renameSkill");
    expect(actions).toContain("setCompetency");
    expect(actions).toContain("setMemberSeniority");
    expect(actions).toContain("addSkillRequirement");
    expect(actions).not.toContain('from "./domain');
  });
});
