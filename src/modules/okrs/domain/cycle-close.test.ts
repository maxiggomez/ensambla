import { describe, expect, it } from "vitest";

import {
  assertAllKeyResultsGraded,
  assertMutableObjective,
  assertStatusTransition,
  validateCycleDates,
} from "./cycle-close";

describe("OKR cycle close", () => {
  it("requires a cycle end after its start", () => {
    expect(
      validateCycleDates(
        new Date("2026-01-01T00:00:00.000Z"),
        new Date("2026-03-31T23:59:59.999Z"),
      ),
    ).toEqual({
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-03-31T23:59:59.999Z"),
    });
    expect(() =>
      validateCycleDates(
        new Date("2026-03-31T00:00:00.000Z"),
        new Date("2026-01-01T00:00:00.000Z"),
      ),
    ).toThrowError(expect.objectContaining({ code: "okrs/invalid-cycle-dates" }));
  });

  it("requires every KeyResult to be graded before close", () => {
    expect(() =>
      assertAllKeyResultsGraded(["Achieved", "Partial", "NotAchieved"]),
    ).not.toThrow();
    expect(() => assertAllKeyResultsGraded(["Achieved", null])).toThrowError(
      expect.objectContaining({ code: "okrs/ungraded-key-results" }),
    );
  });

  it("allows only published to closed and closed to archived transitions", () => {
    expect(() => assertStatusTransition("Published", "Closed")).not.toThrow();
    expect(() => assertStatusTransition("Closed", "Archived")).not.toThrow();
    expect(() => assertStatusTransition("Draft", "Archived")).toThrowError(
      expect.objectContaining({ code: "okrs/invalid-status-transition" }),
    );
  });

  it("treats archived Objectives as read-only", () => {
    expect(() => assertMutableObjective("Published")).not.toThrow();
    expect(() => assertMutableObjective("Archived")).toThrowError(
      expect.objectContaining({ code: "okrs/objective-read-only" }),
    );
  });
});
