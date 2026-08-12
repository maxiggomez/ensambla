import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { inputLever } from "./input-lever";

describe("input lever", () => {
  it("keeps a non-empty name with an optional objective link", () => {
    expect(inputLever({ name: "  Leads calificados  ", objectiveId: "obj-1" })).toEqual({
      name: "Leads calificados",
      objectiveId: "obj-1",
    });
    expect(inputLever({ name: "Leads calificados" })).toEqual({
      name: "Leads calificados",
      objectiveId: null,
    });
  });

  it("rejects an empty name", () => {
    expect(() => inputLever({ name: "   " })).toThrowError(
      expect.objectContaining({ code: "strategy-northstar/invalid-lever-name" }),
    );
    expect(() => inputLever({ name: "" })).toThrowError(DomainError);
  });
});
