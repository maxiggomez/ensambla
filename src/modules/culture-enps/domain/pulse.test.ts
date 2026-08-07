import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { parsePulseScope } from "./pulse";
import { canManagePulses } from "./pulse-policy";
import { nextOccurrence } from "./recurrence";

describe("Pulse", () => {
  it("accepts Organization scope without a Team and Team scope with a Team", () => {
    expect(parsePulseScope({ type: "organization" })).toEqual({ type: "organization" });
    expect(parsePulseScope({ type: "team", teamId: "team-1" })).toEqual({
      type: "team",
      teamId: "team-1",
    });
  });

  it("rejects inconsistent or empty scopes", () => {
    expect(() => parsePulseScope({ type: "organization", teamId: "team-1" })).toThrowError(
      new DomainError("culture-enps/invalid-scope", "Organization scope cannot include a Team"),
    );
    expect(() => parsePulseScope({ type: "team", teamId: "  " })).toThrowError(
      new DomainError("culture-enps/invalid-scope", "Team scope requires a Team"),
    );
  });
});

describe("Pulse recurrence", () => {
  it.each([
    ["weekly", "2026-08-04T12:00:00.000Z", "2026-08-11T12:00:00.000Z"],
    ["monthly", "2026-08-04T12:00:00.000Z", "2026-09-04T12:00:00.000Z"],
    ["quarterly", "2026-08-04T12:00:00.000Z", "2026-11-04T12:00:00.000Z"],
  ] as const)("advances a %s schedule", (frequency, from, expected) => {
    expect(nextOccurrence(new Date(from), frequency)).toEqual(new Date(expected));
  });

  it("clamps monthly recurrence to the last valid calendar day", () => {
    expect(nextOccurrence(new Date("2026-01-31T12:00:00.000Z"), "monthly")).toEqual(
      new Date("2026-02-28T12:00:00.000Z"),
    );
  });
});

describe("Pulse policy", () => {
  it("allows only Dirección to launch pulses or change configuration", () => {
    expect(canManagePulses("Direccion")).toBe(true);
    expect(canManagePulses("Lider")).toBe(false);
    expect(canManagePulses("Colaborador")).toBe(false);
  });
});
