import { describe, expect, it } from "vitest";

import { teamDescription, teamName } from "./team";
import { TEAM_ROLES } from "./team-role";

describe("team", () => {
  it("requires a non-empty name (trimmed)", () => {
    expect(teamName("  Producto  ")).toBe("Producto");
    expect(() => teamName("   ")).toThrowError(
      expect.objectContaining({ code: "teams-staffing/invalid-name" }),
    );
  });

  it("description is optional and trimmed; empty becomes null", () => {
    expect(teamDescription("  Equipo de producto  ")).toBe("Equipo de producto");
    expect(teamDescription("   ")).toBeNull();
    expect(teamDescription(undefined)).toBeNull();
    expect(teamDescription(null)).toBeNull();
  });

  it("supports the two roles within a team", () => {
    expect(TEAM_ROLES).toEqual(["Lead", "Contributor"]);
  });
});
