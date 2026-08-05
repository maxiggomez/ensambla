import { describe, expect, it } from "vitest";

import type { Measurement } from "../../../shared/measurement";

import { calculateEnps } from "./enps";
import { parseMinimumResponses } from "./minimum-responses";

type IntegerMeasurement = Extract<Measurement, { type: "integer" }>;

function rating(current: number): IntegerMeasurement {
  return { type: "integer", start: 0, target: 10, current };
}

describe("minimum N threshold 🔒", () => {
  it("suppresses every aggregate field below the default N=4", () => {
    expect(
      calculateEnps({ ratings: [rating(10), rating(9), rating(0)], recipientCount: 8 }),
    ).toEqual({ status: "suppressed", minimumResponses: 4 });
  });

  it("uses a configured threshold", () => {
    expect(
      calculateEnps({
        ratings: [rating(10), rating(9), rating(8), rating(7)],
        recipientCount: 8,
        minimumResponses: 5,
      }),
    ).toEqual({ status: "suppressed", minimumResponses: 5 });
  });

  it.each([3, 4.5, 101])("rejects unsafe or invalid thresholds (%s)", (value) => {
    expect(() => parseMinimumResponses(value)).toThrow();
  });

  it.each([4, 5, 100])("accepts safe configurable thresholds (%s)", (value) => {
    expect(parseMinimumResponses(value)).toBe(value);
  });
});

describe("eNPS calculation", () => {
  it("classifies promoters, passives and detractors and returns typed metrics", () => {
    expect(
      calculateEnps({
        ratings: [rating(10), rating(9), rating(8), rating(0)],
        recipientCount: 8,
      }),
    ).toEqual({
      status: "visible",
      score: { type: "integer", start: -100, target: 100, current: 25 },
      participation: { type: "percentage", start: 0, target: 100, current: 50 },
      promoters: { type: "percentage", start: 0, target: 100, current: 50 },
      passives: { type: "percentage", start: 0, target: 100, current: 25 },
      detractors: { type: "percentage", start: 0, target: 100, current: 25 },
    });
  });

  it("rounds eNPS and percentages to whole points", () => {
    const result = calculateEnps({
      ratings: [rating(10), rating(9), rating(7), rating(8), rating(0), rating(1)],
      recipientCount: 8,
    });

    expect(result).toMatchObject({
      status: "visible",
      score: { current: 0 },
      promoters: { current: 33 },
      passives: { current: 33 },
      detractors: { current: 33 },
      participation: { current: 75 },
    });
  });
});
