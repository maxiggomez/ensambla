import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { strategicPillar } from "./strategic-pillar";

describe("strategic pillar", () => {
  it("keeps a non-empty name and an optional normalized description", () => {
    expect(
      strategicPillar({ name: "  Crecimiento  ", description: "  Palancas de expansión  " }),
    ).toEqual({
      name: "Crecimiento",
      description: "Palancas de expansión",
    });
    expect(strategicPillar({ name: "Crecimiento" })).toEqual({
      name: "Crecimiento",
      description: null,
    });
  });

  it("rejects an empty name", () => {
    expect(() => strategicPillar({ name: "   " })).toThrowError(
      expect.objectContaining({ code: "strategy-northstar/invalid-pillar-name" }),
    );
    expect(() => strategicPillar({ name: "" })).toThrowError(DomainError);
  });
});
