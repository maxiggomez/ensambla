import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = [
  "page.tsx",
  "okr-forms.tsx",
  "loading.tsx",
  "error.tsx",
  "../dashboard/page.tsx",
];

describe("OKRs UI design-system contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("replaces the placeholder with the complete Spanish OKR lifecycle", () => {
    expect(sources).not.toContain("UnderConstruction");
    expect(sources).toContain("Crear objetivo");
    expect(sources).toContain("Registrar check-in");
    expect(sources).toContain("Cadencia");
    expect(sources).toContain("Alineamiento");
    expect(sources).toContain("Cerrar ciclo");
    expect(sources).toContain("Historial archivado");
    expect(sources).toContain("Key Results en riesgo");
  });

  it("provides empty, loading and error guidance", () => {
    expect(sources).toContain("Creá tu primer objetivo");
    expect(sources).toContain("Cargando OKRs");
    expect(sources).toContain("No pudimos cargar los OKRs");
  });

  it("uses labelled controls without hardcoded colors", () => {
    expect(sources).toContain("<Label");
    expect(sources).toContain("<fieldset");
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });

  it("consumes the public evidence limit instead of duplicating it", () => {
    const actions = readFileSync(join(__dirname, "actions.ts"), "utf8");
    expect(actions).toContain("MAX_EVIDENCE_FILE_BYTES,");
    expect(actions).not.toContain("const MAX_EVIDENCE_FILE_BYTES");
  });
});
