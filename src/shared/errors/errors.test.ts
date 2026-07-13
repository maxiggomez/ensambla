import { describe, expect, it } from "vitest";

import { ApplicationError, DomainError } from "./index";

describe("base errors", () => {
  it("DomainError carries code and message and works with instanceof", () => {
    const error = new DomainError("measurement/invalid-value", "Invalid value for type");
    expect(error.code).toBe("measurement/invalid-value");
    expect(error.message).toBe("Invalid value for type");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ApplicationError);
  });

  it("ApplicationError carries code and message and works with instanceof", () => {
    const error = new ApplicationError("org/not-found", "Organization not found");
    expect(error.code).toBe("org/not-found");
    expect(error.message).toBe("Organization not found");
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(DomainError);
  });
});
