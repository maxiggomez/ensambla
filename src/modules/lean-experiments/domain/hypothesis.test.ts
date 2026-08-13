import { describe, expect, it } from "vitest";

import { parseHypothesis } from "./hypothesis";

describe("Lean hypothesis", () => {
  it("stores normalized fields and renders the structured format", () => {
    expect(
      parseHypothesis({
        belief: "  onboarding guiado reduce fricción  ",
        expectedOutcome: "  aumenta la activación  ",
      }),
    ).toEqual({
      belief: "onboarding guiado reduce fricción",
      expectedOutcome: "aumenta la activación",
      statement:
        "We believe onboarding guiado reduce fricción → we expect aumenta la activación",
    });
  });

  it.each([
    { belief: "", expectedOutcome: "mejora" },
    { belief: "hipótesis", expectedOutcome: "   " },
  ])("rejects an empty field", (input) => {
    expect(() => parseHypothesis(input)).toThrowError(
      expect.objectContaining({ code: "lean-experiments/invalid-hypothesis" }),
    );
  });
});
