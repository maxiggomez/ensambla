import { describe, expect, it } from "vitest";

import { capacityPercent, isOverloaded, personLoad, teamCapacity } from "./capacity";

describe("capacity (derivada, nunca editada)", () => {
  it("a team's capacity is the sum of its assignments' percentages", () => {
    expect(teamCapacity([{ capacityPercent: 60 }, { capacityPercent: 50 }])).toBe(110);
    expect(teamCapacity([])).toBe(0);
  });

  it("a person's load is the sum of their percentages across teams", () => {
    expect(personLoad([{ capacityPercent: 60 }, { capacityPercent: 60 }])).toBe(120);
    expect(personLoad([{ capacityPercent: 100 }])).toBe(100);
  });

  it("overloaded only above 100 (exactly 100 is full, not overloaded)", () => {
    expect(isOverloaded(101)).toBe(true);
    expect(isOverloaded(120)).toBe(true);
    expect(isOverloaded(100)).toBe(false);
    expect(isOverloaded(0)).toBe(false);
  });

  it("an individual assignment percentage is an integer within [0, 100]", () => {
    expect(capacityPercent(0)).toBe(0);
    expect(capacityPercent(100)).toBe(100);
    for (const invalid of [150, -10, 50.5, Number.NaN]) {
      expect(() => capacityPercent(invalid)).toThrowError(
        expect.objectContaining({ code: "teams-staffing/invalid-capacity" }),
      );
    }
  });
});
