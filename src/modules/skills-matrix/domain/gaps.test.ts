import { describe, expect, it } from "vitest";

import { evaluateGaps } from "./gaps";

describe("skill gaps (umbrales MVP)", () => {
  it("raises a coverage gap when ≥2 published objectives require a skill covered by <2 people", () => {
    const result = evaluateGaps([
      { skillId: "rust", requiringObjectiveIds: ["o1", "o2"], coverageCount: 1 },
      { skillId: "react", requiringObjectiveIds: ["o1", "o2"], coverageCount: 2 },
      { skillId: "ventas", requiringObjectiveIds: ["o1"], coverageCount: 0 },
    ]);
    expect(result.coverageGaps).toEqual(["rust"]);
  });

  it("flags bus factor when a required skill is covered by exactly one person", () => {
    const result = evaluateGaps([
      { skillId: "rust", requiringObjectiveIds: ["o1"], coverageCount: 1 },
      { skillId: "react", requiringObjectiveIds: ["o1"], coverageCount: 2 },
      { skillId: "sin-demanda", requiringObjectiveIds: [], coverageCount: 1 },
    ]);
    expect(result.busFactorRisks).toEqual(["rust"]);
  });

  it("raises nothing with enough coverage", () => {
    const result = evaluateGaps([
      { skillId: "react", requiringObjectiveIds: ["o1", "o2", "o3"], coverageCount: 3 },
    ]);
    expect(result.coverageGaps).toEqual([]);
    expect(result.busFactorRisks).toEqual([]);
  });
});
