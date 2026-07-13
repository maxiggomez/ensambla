import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { organizationName } from "./organization-name";

describe("organization name (ORG-1)", () => {
  it("accepts a valid name, trimmed", () => {
    expect(organizationName("  Acme SRL  ")).toBe("Acme SRL");
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(() => organizationName("")).toThrow(DomainError);
    expect(() => organizationName("   ")).toThrow(DomainError);
  });
});
