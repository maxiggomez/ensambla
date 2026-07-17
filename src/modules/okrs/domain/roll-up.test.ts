import { describe, expect, it } from "vitest";

import type { Measurement } from "../../../shared/measurement";

import { rollUp } from "./roll-up";

describe("rollUp 🔒 (ADR-0004)", () => {
  it("averages the progress of all key results with equal weight", () => {
    const measurements: Measurement[] = [
      { type: "integer", start: 0, target: 10, current: 5 }, // 50
      { type: "check", done: true }, // 100
      { type: "text", state: "in_progress" }, // 0
    ];
    expect(rollUp(measurements)).toBe(50);
  });

  it("check contributes 0 or 100 according to done", () => {
    expect(rollUp([{ type: "check", done: false }])).toBe(0);
    expect(rollUp([{ type: "check", done: true }])).toBe(100);
  });

  it("text contributes 0 unless done, 100 when done", () => {
    expect(rollUp([{ type: "text", state: "not_started" }])).toBe(0);
    expect(rollUp([{ type: "text", state: "in_progress" }])).toBe(0);
    expect(rollUp([{ type: "text", state: "done" }])).toBe(100);
  });

  it("is 0 for an objective without key results (drafts do not advance)", () => {
    expect(rollUp([])).toBe(0);
  });

  it("stays within [0, 100] even with overshooting key results", () => {
    const overshoot: Measurement[] = [
      { type: "currency", start: 0, target: 100, current: 250 }, // clamped to 100
      { type: "check", done: true },
    ];
    expect(rollUp(overshoot)).toBe(100);
  });
});
