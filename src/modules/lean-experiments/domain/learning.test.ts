import { describe, expect, it } from "vitest";

import { parseLearning } from "./learning";

describe("Structured learning", () => {
  it.each(["persevere", "pivot"] as const)("accepts a complete %s decision", (decision) => {
    expect(
      parseLearning({
        believed: "  los usuarios necesitaban guía  ",
        tested: "  un wizard de tres pasos  ",
        learned: "  completan más rápido  ",
        decision,
      }),
    ).toEqual({
      believed: "los usuarios necesitaban guía",
      tested: "un wizard de tres pasos",
      learned: "completan más rápido",
      decision,
    });
  });

  it.each([
    { believed: "", tested: "test", learned: "learn", decision: "pivot" },
    { believed: "belief", tested: "", learned: "learn", decision: "pivot" },
    { believed: "belief", tested: "test", learned: "", decision: "pivot" },
    { believed: "belief", tested: "test", learned: "learn", decision: "pause" },
  ])("rejects incomplete or invalid learning", (input) => {
    expect(() => parseLearning(input)).toThrowError(
      expect.objectContaining({ code: "lean-experiments/invalid-learning" }),
    );
  });
});
