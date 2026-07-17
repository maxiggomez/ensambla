import { describe, expect, it } from "vitest";

import { SENIORITIES, seniorityRank } from "./seniority";

describe("seniority", () => {
  it("supports the three seniority values", () => {
    expect(SENIORITIES).toEqual(["Junior", "SemiSenior", "Senior"]);
  });

  it("ranks Senior > SemiSenior > Junior > missing", () => {
    expect(seniorityRank("Senior")).toBeGreaterThan(seniorityRank("SemiSenior"));
    expect(seniorityRank("SemiSenior")).toBeGreaterThan(seniorityRank("Junior"));
    expect(seniorityRank("Junior")).toBeGreaterThan(seniorityRank(null));
    expect(seniorityRank(undefined)).toBe(seniorityRank(null));
  });
});
