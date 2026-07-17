import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { northStar } from "./north-star";

describe("north star (ADR-0004)", () => {
  it("holds a name and a typed Measurement with current value and target", () => {
    const result = northStar({
      name: "  ARR  ",
      measurement: { type: "currency", start: 0, target: 1_000_000, current: 250_000 },
    });
    expect(result).toEqual({
      name: "ARR",
      measurement: { type: "currency", start: 0, target: 1_000_000, current: 250_000 },
    });
  });

  it("rejects an empty name", () => {
    expect(() =>
      northStar({ name: "   ", measurement: { type: "check", done: false } }),
    ).toThrowError(expect.objectContaining({ code: "strategy-northstar/invalid-name" }));
  });

  it("rejects a malformed measurement", () => {
    expect(() =>
      northStar({ name: "ARR", measurement: { type: "percentage", start: 0 } }),
    ).toThrowError(DomainError);
    expect(() => northStar({ name: "ARR", measurement: { type: "unknown" } })).toThrowError(
      expect.objectContaining({ code: "strategy-northstar/invalid-measurement" }),
    );
  });
});
