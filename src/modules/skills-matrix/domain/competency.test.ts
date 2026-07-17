import { describe, expect, it } from "vitest";

import { competencyLevel } from "./competency";
import { skillName } from "./skill";

describe("competency & skill", () => {
  it("level is an integer within [0, 4]; 0 is a valid explicit level", () => {
    expect(competencyLevel(0)).toBe(0);
    expect(competencyLevel(4)).toBe(4);
    for (const invalid of [5, -1, 2.5, Number.NaN]) {
      expect(() => competencyLevel(invalid)).toThrowError(
        expect.objectContaining({ code: "skills-matrix/invalid-level" }),
      );
    }
  });

  it("skill name is trimmed and non-empty", () => {
    expect(skillName("  TypeScript  ")).toBe("TypeScript");
    expect(() => skillName("   ")).toThrowError(
      expect.objectContaining({ code: "skills-matrix/invalid-name" }),
    );
  });
});
