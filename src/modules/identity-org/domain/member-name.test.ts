import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { memberName } from "./member-name";

describe("member name (F.5)", () => {
  it("accepts a valid name, trimmed", () => {
    expect(memberName("  Bruno Díaz  ")).toBe("Bruno Díaz");
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(() => memberName("")).toThrow(DomainError);
    expect(() => memberName("   ")).toThrow(DomainError);
  });
});
