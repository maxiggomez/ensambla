import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { DRIVERS } from "./driver";
import { createPulseResponse } from "./pulse-response";

describe("anonymous PulseResponse", () => {
  it("models an eNPS rating as the shared Integer Measurement", () => {
    expect(
      createPulseResponse({ score: 9, driver: "Recognition", comment: "  Gran equipo  " }),
    ).toEqual({
      rating: { type: "integer", start: 0, target: 10, current: 9 },
      driver: "Recognition",
      comment: "Gran equipo",
    });
  });

  it.each([-1, 1.5, 11, Number.NaN])("rejects an invalid eNPS score (%s)", (score) => {
    expect(() => createPulseResponse({ score, driver: "Other" })).toThrowError(DomainError);
  });

  it("normalizes an empty comment without adding identity metadata", () => {
    const response = createPulseResponse({ score: 7, driver: "Workload", comment: "  " });

    expect(response).toEqual({
      rating: { type: "integer", start: 0, target: 10, current: 7 },
      driver: "Workload",
      comment: null,
    });
    expect(response).not.toHaveProperty("memberId");
    expect(response).not.toHaveProperty("participantId");
  });

  it("uses a closed driver set", () => {
    expect(DRIVERS).toEqual([
      "Recognition",
      "GoalClarity",
      "CareerGrowth",
      "Workload",
      "Coordination",
      "Other",
    ]);
    expect(() => createPulseResponse({ score: 8, driver: "Unknown" as "Other" })).toThrowError(
      new DomainError("culture-enps/invalid-driver", "Invalid response driver"),
    );
  });
});
