import { describe, expect, it } from "vitest";

import { suggestCandidates, type StaffingCandidate } from "./matching";

function candidate(
  partial: Partial<StaffingCandidate> & { memberId: string },
): StaffingCandidate {
  return {
    name: partial.memberId,
    seniorityRank: 0,
    load: 0,
    skillLevels: [0],
    ...partial,
  };
}

describe("staffing match (orden lexicográfico)", () => {
  it("orders by average skill level, then seniority, then availability, then name", () => {
    const suggestions = suggestCandidates([
      candidate({ memberId: "low-level", skillLevels: [2], seniorityRank: 3, load: 0 }),
      candidate({ memberId: "senior", skillLevels: [4], seniorityRank: 3, load: 40 }),
      candidate({ memberId: "semi", skillLevels: [4], seniorityRank: 2, load: 0 }),
      candidate({ memberId: "busy-senior", skillLevels: [4], seniorityRank: 3, load: 60 }),
    ]);
    expect(suggestions.map((s) => s.memberId)).toEqual([
      "senior", // nivel 4, rank 3, disponibilidad 60
      "busy-senior", // nivel 4, rank 3, disponibilidad 40
      "semi", // nivel 4, rank 2
      "low-level", // nivel 2
    ]);
  });

  it("averages levels across required skills and excludes people with average 0", () => {
    const suggestions = suggestCandidates([
      candidate({ memberId: "half", skillLevels: [4, 0] }), // promedio 2
      candidate({ memberId: "none", skillLevels: [0, 0] }), // promedio 0 → afuera
      candidate({ memberId: "full", skillLevels: [3, 3] }), // promedio 3
    ]);
    expect(suggestions.map((s) => s.memberId)).toEqual(["full", "half"]);
    expect(suggestions[0]?.skillLevel).toBe(3);
    expect(suggestions[1]?.skillLevel).toBe(2);
  });

  it("flags no margin at load 100 or above but still suggests the person", () => {
    const suggestions = suggestCandidates([
      candidate({ memberId: "full-load", skillLevels: [4], load: 100 }),
      candidate({ memberId: "overloaded", skillLevels: [4], load: 120 }),
      candidate({ memberId: "free", skillLevels: [1], load: 0 }),
    ]);
    expect(suggestions.map((s) => s.memberId)).toContain("full-load");
    expect(suggestions.find((s) => s.memberId === "full-load")).toMatchObject({
      noMargin: true,
      availability: 0,
    });
    expect(suggestions.find((s) => s.memberId === "overloaded")).toMatchObject({
      noMargin: true,
      availability: 0,
    });
    expect(suggestions.find((s) => s.memberId === "free")?.noMargin).toBe(false);
  });

  it("missing seniority ranks last among equals", () => {
    const suggestions = suggestCandidates([
      candidate({ memberId: "sin-dato", skillLevels: [3], seniorityRank: 0 }),
      candidate({ memberId: "junior", skillLevels: [3], seniorityRank: 1 }),
    ]);
    expect(suggestions.map((s) => s.memberId)).toEqual(["junior", "sin-dato"]);
  });
});
