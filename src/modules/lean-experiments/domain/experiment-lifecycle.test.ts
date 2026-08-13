import { describe, expect, it } from "vitest";

import type { Measurement } from "../../../shared/measurement";

import { assertExperimentTransition, type ExperimentStatus } from "./experiment-lifecycle";

const metric: Measurement = { type: "percentage", start: 0, target: 20, current: 5 };

describe("Experiment lifecycle", () => {
  it.each([
    ["Hypothesis", "Building"],
    ["Building", "Measuring"],
    ["Measuring", "Learned"],
  ] as const)("accepts %s → %s with required data", (from, to) => {
    expect(() =>
      assertExperimentTransition({
        from,
        to,
        measurement: to === "Measuring" ? metric : undefined,
        cutoffAt: to === "Measuring" ? new Date("2026-09-01T00:00:00Z") : undefined,
        hasLearning: to === "Learned",
      }),
    ).not.toThrow();
  });

  it.each([
    ["Hypothesis", "Measuring"],
    ["Building", "Building"],
    ["Measuring", "Building"],
    ["Learned", "Measuring"],
  ] as [ExperimentStatus, ExperimentStatus][])("rejects invalid %s → %s", (from, to) => {
    expect(() => assertExperimentTransition({ from, to })).toThrowError(
      expect.objectContaining({ code: "lean-experiments/invalid-transition" }),
    );
  });

  it("requires both a valid Measurement and cutoff for Measuring", () => {
    expect(() =>
      assertExperimentTransition({ from: "Building", to: "Measuring", cutoffAt: new Date() }),
    ).toThrowError(expect.objectContaining({ code: "lean-experiments/measurement-required" }));
    expect(() =>
      assertExperimentTransition({ from: "Building", to: "Measuring", measurement: metric }),
    ).toThrowError(expect.objectContaining({ code: "lean-experiments/cutoff-required" }));
    expect(() =>
      assertExperimentTransition({
        from: "Building",
        to: "Measuring",
        measurement: { type: "percentage", start: 0, target: 120, current: 5 },
        cutoffAt: new Date(),
      }),
    ).toThrowError(expect.objectContaining({ code: "lean-experiments/invalid-measurement" }));
  });

  it("requires a parsed learning before Learned", () => {
    expect(() => assertExperimentTransition({ from: "Measuring", to: "Learned" })).toThrowError(
      expect.objectContaining({ code: "lean-experiments/learning-required" }),
    );
  });
});
