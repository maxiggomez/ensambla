import { describe, expect, it } from "vitest";

import { resolveAuthMode, type AuthEnv } from "./mode";

describe("resolveAuthMode (2.1)", () => {
  it("never selects mock in production, even with the flag set", () => {
    expect(resolveAuthMode({ NODE_ENV: "production", AUTH_MODE: "mock" })).toBe("clerk");
  });

  it("selects mock only with the explicit flag in development", () => {
    expect(resolveAuthMode({ NODE_ENV: "development", AUTH_MODE: "mock" })).toBe("mock");
  });

  it("defaults to clerk without the flag or with an explicit clerk mode", () => {
    const env: AuthEnv = { NODE_ENV: "development", AUTH_MODE: undefined };
    expect(resolveAuthMode(env)).toBe("clerk");
    expect(resolveAuthMode({ ...env, AUTH_MODE: "clerk" })).toBe("clerk");
  });
});
