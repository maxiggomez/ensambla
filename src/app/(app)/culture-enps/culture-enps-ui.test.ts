import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_FILES = [
  "page.tsx",
  "response-form.tsx",
  "management-forms.tsx",
  "loading.tsx",
  "error.tsx",
];

describe("culture-enps UI design-system contract", () => {
  const sources = UI_FILES.map((file) => readFileSync(join(__dirname, file), "utf8")).join(
    "\n",
  );

  it("uses Spanish labels and states with an explicit anonymity notice", () => {
    expect(sources).toContain("Tu respuesta es");
    expect(sources).toContain("anónima");
    expect(sources).toContain("Resultados protegidos");
    expect(sources).toContain("No tenés pulsos pendientes");
  });

  it("does not hardcode color values outside the Radar token system", () => {
    expect(sources).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(sources).not.toMatch(/rgb\(/i);
  });

  it("keeps form controls labelled and keyboard-focusable", () => {
    expect(sources).toContain("<Label");
    expect(sources).toContain("<fieldset");
    expect(sources).toContain("focus-visible:ring");
  });
});
