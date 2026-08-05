import { describe, expect, it } from "vitest";

import type { Measurement } from "../../../shared/measurement";

import { correlateTeamEnps } from "./correlation";

type IntegerMeasurement = Extract<Measurement, { type: "integer" }>;
type PercentageMeasurement = Extract<Measurement, { type: "percentage" }>;

function enps(current: number): IntegerMeasurement {
  return { type: "integer", start: -100, target: 100, current };
}

function capacity(current: number): PercentageMeasurement {
  return { type: "percentage", start: 0, target: 100, current };
}

describe("Team eNPS operational correlation", () => {
  it("reports a coincidence when eNPS falls and Team capacity exceeds 100%", () => {
    expect(
      correlateTeamEnps({
        previous: enps(35),
        current: enps(9),
        signals: [{ type: "over_capacity", capacity: capacity(118) }],
      }),
    ).toEqual([
      {
        type: "enps_drop_with_over_capacity",
        relationship: "coincidence",
        enpsChange: { type: "integer", start: -200, target: 0, current: -26 },
        capacity: capacity(118),
      },
    ]);
  });

  it("does not report a correlation without a fall or without overload", () => {
    expect(
      correlateTeamEnps({
        previous: enps(9),
        current: enps(12),
        signals: [{ type: "over_capacity", capacity: capacity(118) }],
      }),
    ).toEqual([]);
    expect(
      correlateTeamEnps({
        previous: enps(35),
        current: enps(9),
        signals: [{ type: "over_capacity", capacity: capacity(100) }],
      }),
    ).toEqual([]);
  });
});
