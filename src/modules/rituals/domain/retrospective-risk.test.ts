import { describe, expect, it } from "vitest";

import { evaluateRetroRisk, retroCycleDays } from "./retrospective-risk";

const at = (iso: string): Date => new Date(iso);

describe("retrospective risk (Scenario: Missing retrospective)", () => {
  it("flags a team with no retrospective at all", () => {
    expect(
      evaluateRetroRisk({
        lastRetroDate: null,
        cycleDays: 14,
        now: at("2026-07-22T00:00:00Z"),
      }),
    ).toBe(true);
  });

  it("flags a team two full cycles without a retrospective", () => {
    expect(
      evaluateRetroRisk({
        lastRetroDate: at("2026-06-24T00:00:00Z"), // 28 días antes = 2 ciclos de 14
        cycleDays: 14,
        now: at("2026-07-22T00:00:00Z"),
      }),
    ).toBe(true);
  });

  it("does not flag a team that had a retrospective within the current cycle", () => {
    expect(
      evaluateRetroRisk({
        lastRetroDate: at("2026-07-15T00:00:00Z"), // 7 días antes = < 1 ciclo
        cycleDays: 14,
        now: at("2026-07-22T00:00:00Z"),
      }),
    ).toBe(false);
  });

  it("does not flag a team one cycle without a retrospective", () => {
    expect(
      evaluateRetroRisk({
        lastRetroDate: at("2026-07-08T00:00:00Z"), // 14 días antes = exactamente 1 ciclo
        cycleDays: 14,
        now: at("2026-07-22T00:00:00Z"),
      }),
    ).toBe(false);
  });

  it("rejects a non-positive cycle length", () => {
    expect(() => retroCycleDays(0)).toThrowError(
      expect.objectContaining({ code: "rituals/invalid-cycle-days" }),
    );
  });
});
