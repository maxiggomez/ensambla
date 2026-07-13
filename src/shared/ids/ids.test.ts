import { describe, expect, expectTypeOf, it } from "vitest";

import { memberId, organizationId, type MemberId, type OrganizationId } from "./index";

const A_UUID = "3f2b6c1e-8d4a-4c9b-9f1e-2a7d5b8c0e13";

describe("branded IDs", () => {
  it("constructors accept a valid uuid", () => {
    expect(organizationId(A_UUID)).toBe(A_UUID);
    expect(memberId(A_UUID)).toBe(A_UUID);
  });

  it("constructors reject an invalid uuid", () => {
    expect(() => organizationId("not-a-uuid")).toThrow();
    expect(() => memberId("")).toThrow();
  });

  it("brands are not assignable across ID types", () => {
    expectTypeOf<OrganizationId>().not.toExtend<MemberId>();
    expectTypeOf<MemberId>().not.toExtend<OrganizationId>();
    // A plain string is not an ID without going through the constructor.
    expectTypeOf<string>().not.toExtend<OrganizationId>();
  });
});
