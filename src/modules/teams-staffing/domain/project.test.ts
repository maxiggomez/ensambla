import { describe, expect, it } from "vitest";

import { closeProjectStatus } from "./project";

describe("Project lifecycle", () => {
  it("moves an Active Project to Closed", () => {
    expect(closeProjectStatus("Active")).toBe("Closed");
  });

  it("rejects repeated closure", () => {
    expect(() => closeProjectStatus("Closed")).toThrowError(
      expect.objectContaining({ code: "teams-staffing/invalid-project-transition" }),
    );
  });
});
