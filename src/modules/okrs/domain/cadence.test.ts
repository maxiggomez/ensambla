import { describe, expect, it } from "vitest";

import { effectiveCadence, isCheckInDue, nextDueAt } from "./cadence";

describe("OKR check-in cadence", () => {
  it("prefers Objective cadence over Team cadence", () => {
    expect(effectiveCadence("Monthly", "Weekly")).toBe("Monthly");
    expect(effectiveCadence(null, "Biweekly")).toBe("Biweekly");
  });

  it("does not force weekly when no cadence is configured", () => {
    expect(effectiveCadence(null, null)).toBeNull();
    expect(
      isCheckInDue({
        cadence: null,
        baselineAt: new Date("2026-01-01T00:00:00.000Z"),
        now: new Date("2027-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("calculates weekly and biweekly due instants", () => {
    const baselineAt = new Date("2026-01-01T12:00:00.000Z");
    expect(nextDueAt(baselineAt, "Weekly")).toEqual(new Date("2026-01-08T12:00:00.000Z"));
    expect(nextDueAt(baselineAt, "Biweekly")).toEqual(new Date("2026-01-15T12:00:00.000Z"));
  });

  it("uses calendar arithmetic for monthly cadence", () => {
    expect(nextDueAt(new Date("2026-01-31T12:00:00.000Z"), "Monthly")).toEqual(
      new Date("2026-02-28T12:00:00.000Z"),
    );
  });

  it("becomes due at the configured period boundary", () => {
    const baselineAt = new Date("2026-01-01T00:00:00.000Z");
    expect(
      isCheckInDue({
        cadence: "Weekly",
        baselineAt,
        now: new Date("2026-01-07T23:59:59.999Z"),
      }),
    ).toBe(false);
    expect(
      isCheckInDue({
        cadence: "Weekly",
        baselineAt,
        now: new Date("2026-01-08T00:00:00.000Z"),
      }),
    ).toBe(true);
  });
});
