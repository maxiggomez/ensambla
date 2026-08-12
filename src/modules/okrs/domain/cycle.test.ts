import { describe, expect, it } from "vitest";

import { cycleName } from "./cycle";

describe("OKR cycle", () => {
  it("requires a non-empty normalized name", () => {
    expect(cycleName("  Q1 2026  ")).toBe("Q1 2026");
    expect(() => cycleName("   ")).toThrowError(
      expect.objectContaining({ code: "okrs/invalid-cycle-name" }),
    );
  });
});
