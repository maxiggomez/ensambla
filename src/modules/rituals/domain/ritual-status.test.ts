import { describe, expect, it } from "vitest";

import {
  evaluateRitualOccurrence,
  holdRitualOccurrence,
  ritualOccurrenceStatus,
} from "./ritual-status";

const at = (y: number, m: number, d: number): Date => new Date(y, m, d);

describe("ritual occurrence status", () => {
  it("marks a scheduled occurrence with a past date as overdue (Scenario: Overdue ritual)", () => {
    expect(
      evaluateRitualOccurrence({
        status: "Scheduled",
        scheduledDate: at(2026, 7, 20),
        now: at(2026, 7, 22),
      }),
    ).toBe("Overdue");
  });

  it("keeps a scheduled occurrence with a future date as scheduled", () => {
    expect(
      evaluateRitualOccurrence({
        status: "Scheduled",
        scheduledDate: at(2026, 7, 27),
        now: at(2026, 7, 22),
      }),
    ).toBe("Scheduled");
  });

  it("never downgrades a held occurrence (Scenario: Hold a ritual)", () => {
    expect(
      evaluateRitualOccurrence({
        status: "Held",
        scheduledDate: at(2026, 7, 13),
        now: at(2026, 7, 22),
      }),
    ).toBe("Held");
    expect(holdRitualOccurrence()).toBe("Held");
  });

  it("validates the status value", () => {
    expect(ritualOccurrenceStatus("Overdue")).toBe("Overdue");
    expect(() => ritualOccurrenceStatus("Cancelled")).toThrowError(
      expect.objectContaining({ code: "rituals/invalid-occurrence-status" }),
    );
  });
});
