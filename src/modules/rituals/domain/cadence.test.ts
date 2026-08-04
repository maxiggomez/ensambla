import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { generateOccurrenceDates, ritualCadence, ritualName } from "./cadence";

const at = (y: number, month: number, d: number): Date => new Date(Date.UTC(y, month - 1, d));

describe("ritual cadence", () => {
  it("generates weekly occurrences from startDate up to throughDate (Scenario: Generate rituals from cadence)", () => {
    const dates = generateOccurrenceDates({
      startDate: at(2026, 7, 6),
      cadence: "Weekly",
      throughDate: at(2026, 7, 27),
    });
    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-07-06",
      "2026-07-13",
      "2026-07-20",
      "2026-07-27",
    ]);
  });

  it("generates biweekly occurrences every 14 days", () => {
    const dates = generateOccurrenceDates({
      startDate: at(2026, 7, 6),
      cadence: "Biweekly",
      throughDate: at(2026, 8, 10),
    });
    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-07-06",
      "2026-07-20",
      "2026-08-03",
    ]);
  });

  it("generates monthly occurrences advancing the month", () => {
    const dates = generateOccurrenceDates({
      startDate: at(2026, 7, 10),
      cadence: "Monthly",
      throughDate: at(2026, 10, 10),
    });
    expect(dates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-07-10",
      "2026-08-10",
      "2026-09-10",
      "2026-10-10",
    ]);
  });

  it("returns no occurrences when throughDate is before startDate", () => {
    expect(
      generateOccurrenceDates({
        startDate: at(2026, 7, 6),
        cadence: "Weekly",
        throughDate: at(2026, 6, 30),
      }),
    ).toEqual([]);
  });

  it("validates name and cadence", () => {
    expect(ritualName("  Daily sync  ")).toBe("Daily sync");
    expect(() => ritualName("   ")).toThrowError(
      expect.objectContaining({ code: "rituals/invalid-name" }),
    );
    expect(ritualCadence("Weekly")).toBe("Weekly");
    expect(() => ritualCadence("Hourly")).toThrowError(
      expect.objectContaining({ code: "rituals/invalid-cadence" }),
    );
  });
});
