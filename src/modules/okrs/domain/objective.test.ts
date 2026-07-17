import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import type { KeyResultValues } from "./key-result";
import { assertPublishable, objectiveTitle, OBJECTIVE_LEVELS } from "./objective";

const validKr: KeyResultValues = {
  measurementType: "integer",
  startValue: 0,
  targetValue: 10,
};

describe("objective", () => {
  it("supports the four cascade levels", () => {
    expect(OBJECTIVE_LEVELS).toEqual(["Company", "Area", "Team", "Person"]);
  });

  it("requires a non-empty title", () => {
    expect(objectiveTitle("  Crecer ingresos  ")).toBe("Crecer ingresos");
    expect(() => objectiveTitle("   ")).toThrowError(
      expect.objectContaining({ code: "okrs/invalid-title" }),
    );
  });

  it("cannot be published without at least one key result", () => {
    expect(() => assertPublishable([])).toThrowError(DomainError);
    expect(() => assertPublishable([])).toThrowError(
      expect.objectContaining({ code: "okrs/objective-without-key-results" }),
    );
  });

  it("cannot be published while any key result is invalid", () => {
    const incomplete: KeyResultValues = {
      measurementType: "percentage",
      startValue: 0,
      targetValue: null,
    };
    expect(() => assertPublishable([validKr, incomplete])).toThrowError(
      expect.objectContaining({ code: "okrs/key-result-invalid" }),
    );
  });

  it("is publishable when every key result is valid", () => {
    expect(() =>
      assertPublishable([validKr, { measurementType: "text" }, { measurementType: "check" }]),
    ).not.toThrow();
  });
});
