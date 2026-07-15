import { describe, expect, it } from "vitest";

import { measurementSchema, progress, type Measurement } from "./index";

describe("Measurement (ADR-0004)", () => {
  describe("Check", () => {
    it("progress() is 0 when not done and 100 when done", () => {
      expect(progress({ type: "check", done: false })).toBe(0);
      expect(progress({ type: "check", done: true })).toBe(100);
    });
  });

  describe("numeric types (Percentage / Integer / Currency)", () => {
    it("progress() = (current − start) / (target − start)", () => {
      const percentage: Measurement = {
        type: "percentage",
        start: 20,
        target: 80,
        current: 50,
      };
      expect(progress(percentage)).toBe(50);

      const integer: Measurement = {
        type: "integer",
        start: 0,
        target: 200,
        current: 50,
      };
      expect(progress(integer)).toBe(25);

      const currency: Measurement = {
        type: "currency",
        start: 1000,
        target: 5000,
        current: 2000,
      };
      expect(progress(currency)).toBe(25);
    });

    it("supports decreasing targets (e.g. reduce churn from 10 to 5)", () => {
      const churn: Measurement = {
        type: "percentage",
        start: 10,
        target: 5,
        current: 7.5,
      };
      expect(progress(churn)).toBe(50);
    });

    it("clamps progress() to [0, 100]", () => {
      const overshoot: Measurement = {
        type: "integer",
        start: 0,
        target: 100,
        current: 150,
      };
      expect(progress(overshoot)).toBe(100);

      const regression: Measurement = {
        type: "integer",
        start: 50,
        target: 100,
        current: 20,
      };
      expect(progress(regression)).toBe(0);
    });

    it("start === target → progress() is 100 if reached, else 0 (no division by zero)", () => {
      const reached: Measurement = {
        type: "integer",
        start: 10,
        target: 10,
        current: 10,
      };
      expect(progress(reached)).toBe(100);

      const notReached: Measurement = {
        type: "integer",
        start: 10,
        target: 10,
        current: 3,
      };
      expect(progress(notReached)).toBe(0);
    });
  });

  describe("Text (🔒 base of OKR roll-up)", () => {
    it("progress() is 100 when done, 0 otherwise", () => {
      expect(progress({ type: "text", state: "done" })).toBe(100);
      expect(progress({ type: "text", state: "not_started" })).toBe(0);
      expect(progress({ type: "text", state: "in_progress" })).toBe(0);
    });
  });

  describe("validation per type", () => {
    it("rejects a Check with a non-boolean value", () => {
      const result = measurementSchema.safeParse({ type: "check", done: "yes" });
      expect(result.success).toBe(false);
    });

    it("rejects a Percentage outside 0–100", () => {
      const result = measurementSchema.safeParse({
        type: "percentage",
        start: 0,
        target: 120,
        current: 50,
      });
      expect(result.success).toBe(false);
    });

    it("rejects an Integer with non-integer values", () => {
      const result = measurementSchema.safeParse({
        type: "integer",
        start: 0,
        target: 100,
        current: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a Currency with non-finite values", () => {
      const result = measurementSchema.safeParse({
        type: "currency",
        start: 0,
        target: Infinity,
        current: 10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a Text with a state outside the enum", () => {
      const result = measurementSchema.safeParse({ type: "text", state: "paused" });
      expect(result.success).toBe(false);
    });

    it("rejects an unknown type discriminator", () => {
      const result = measurementSchema.safeParse({ type: "rating", value: 5 });
      expect(result.success).toBe(false);
    });

    it("accepts one valid value per type", () => {
      const valid: unknown[] = [
        { type: "check", done: true },
        { type: "percentage", start: 0, target: 100, current: 30 },
        { type: "integer", start: 0, target: 10, current: 2 },
        { type: "currency", start: 0, target: 5000, current: 1200 },
        { type: "text", state: "in_progress" },
      ];
      for (const value of valid) {
        expect(measurementSchema.safeParse(value).success).toBe(true);
      }
    });
  });
});
