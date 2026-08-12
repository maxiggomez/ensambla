import { describe, expect, it } from "vitest";

import { assertAcyclicAlignment, isOrphan, validateObjectiveScope } from "./alignment";

describe("OKR alignment", () => {
  it("requires an explicit Team for Team-level Objectives", () => {
    expect(validateObjectiveScope("Team", "team-1")).toEqual({ teamId: "team-1" });
    expect(() => validateObjectiveScope("Team", null)).toThrowError(
      expect.objectContaining({ code: "okrs/team-required" }),
    );
  });

  it("rejects a Team association for other Objective levels", () => {
    expect(validateObjectiveScope("Company", null)).toEqual({ teamId: null });
    expect(() => validateObjectiveScope("Person", "team-1")).toThrowError(
      expect.objectContaining({ code: "okrs/team-not-allowed" }),
    );
  });

  it("derives orphan status from parent and pillar links", () => {
    expect(isOrphan({ parentObjectiveId: null, pillarIds: [] })).toBe(true);
    expect(isOrphan({ parentObjectiveId: "parent-1", pillarIds: [] })).toBe(false);
    expect(isOrphan({ parentObjectiveId: null, pillarIds: ["pillar-1"] })).toBe(false);
  });

  it("rejects self and ancestor cycles", () => {
    expect(() => assertAcyclicAlignment("objective-1", "objective-1", [])).toThrowError(
      expect.objectContaining({ code: "okrs/alignment-cycle" }),
    );
    expect(() =>
      assertAcyclicAlignment("objective-1", "objective-2", ["objective-3", "objective-1"]),
    ).toThrowError(expect.objectContaining({ code: "okrs/alignment-cycle" }));
    expect(() =>
      assertAcyclicAlignment("objective-1", "objective-2", ["objective-3"]),
    ).not.toThrow();
  });
});
