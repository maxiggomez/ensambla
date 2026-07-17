import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { isValidForPublishing, toMeasurement, type KeyResultValues } from "./key-result";

describe("key result typed values (ADR-0004)", () => {
  it("a numeric key result without start or target is invalid for publishing", () => {
    const noTarget: KeyResultValues = {
      measurementType: "percentage",
      startValue: 0,
      targetValue: null,
    };
    const noStart: KeyResultValues = {
      measurementType: "integer",
      startValue: null,
      targetValue: 10,
    };
    expect(isValidForPublishing(noTarget)).toBe(false);
    expect(isValidForPublishing(noStart)).toBe(false);
    expect(() => toMeasurement(noTarget)).toThrowError(DomainError);
    expect(() => toMeasurement(noTarget)).toThrowError(
      expect.objectContaining({ code: "okrs/key-result-invalid" }),
    );
  });

  it("a complete numeric key result maps to a Measurement; current defaults to start", () => {
    const values: KeyResultValues = {
      measurementType: "currency",
      startValue: 1000,
      targetValue: 5000,
    };
    expect(isValidForPublishing(values)).toBe(true);
    expect(toMeasurement(values)).toEqual({
      type: "currency",
      start: 1000,
      target: 5000,
      current: 1000,
    });
  });

  it("a text key result is valid without a numeric target; state defaults to not_started", () => {
    const values: KeyResultValues = { measurementType: "text" };
    expect(isValidForPublishing(values)).toBe(true);
    expect(toMeasurement(values)).toEqual({ type: "text", state: "not_started" });
  });

  it("a check key result is valid and defaults to not done", () => {
    const values: KeyResultValues = { measurementType: "check" };
    expect(isValidForPublishing(values)).toBe(true);
    expect(toMeasurement(values)).toEqual({ type: "check", done: false });
  });

  it("rejects numeric values outside the type's domain", () => {
    const outOfRange: KeyResultValues = {
      measurementType: "percentage",
      startValue: 0,
      targetValue: 150, // percentage is bounded to [0, 100]
    };
    expect(isValidForPublishing(outOfRange)).toBe(false);
    expect(() => toMeasurement(outOfRange)).toThrowError(
      expect.objectContaining({ code: "okrs/key-result-invalid" }),
    );
  });
});
