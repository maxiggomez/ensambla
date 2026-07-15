import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import { memberEmail } from "./member-email";

describe("member email (ORG-2 merge key)", () => {
  it("normalizes trimming and lowercasing so invitations merge by email", () => {
    expect(memberEmail("  Ana@Org-A.COM ")).toBe("ana@org-a.com");
    expect(memberEmail("bruno@org-a.com")).toBe("bruno@org-a.com");
  });

  it("rejects an invalid email", () => {
    expect(() => memberEmail("sin-arroba")).toThrow(DomainError);
    expect(() => memberEmail("")).toThrow(DomainError);
    expect(() => memberEmail("   ")).toThrow(DomainError);
  });
});
