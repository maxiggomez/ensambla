import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { strategyStatement } from "./strategy-statement";

describe("strategy statement (vision, mission, values)", () => {
  it("normalizes and keeps a complete set of statements", () => {
    const result = strategyStatement({
      vision: "  Ser la empresa más ágil  ",
      mission: "  Ayudar a pymes a alinearse  ",
      values: ["  Cercanía  ", "Candor"],
    });
    expect(result).toEqual({
      vision: "Ser la empresa más ágil",
      mission: "Ayudar a pymes a alinearse",
      values: ["Cercanía", "Candor"],
    });
  });

  it("tolerates missing vision and mission", () => {
    expect(strategyStatement({ values: ["Candor"] })).toEqual({
      vision: null,
      mission: null,
      values: ["Candor"],
    });
  });

  it("rejects an empty vision", () => {
    expect(() => strategyStatement({ vision: "   ", values: [] })).toThrowError(
      expect.objectContaining({ code: "strategy-northstar/invalid-vision" }),
    );
  });

  it("rejects an empty mission", () => {
    expect(() => strategyStatement({ mission: "   ", values: [] })).toThrowError(
      expect.objectContaining({ code: "strategy-northstar/invalid-mission" }),
    );
  });

  it("rejects an empty value item", () => {
    expect(() => strategyStatement({ values: ["Cercanía", "  "] })).toThrowError(
      expect.objectContaining({ code: "strategy-northstar/invalid-value" }),
    );
    expect(() => strategyStatement({ values: ["  "] })).toThrowError(DomainError);
  });
});
