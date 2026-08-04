import { describe, expect, it } from "vitest";

import { openBlockerStatus, resolveBlocker, blockerStatus, blockerTitle } from "./blocker";

describe("blocker", () => {
  it("records a blocker as open (owner and creation date live at the application layer) (Scenario: Record a blocker)", () => {
    expect(openBlockerStatus()).toBe("Open");
    expect(blockerTitle("  DB outage  ")).toBe("DB outage");
  });

  it("rejects an empty title", () => {
    expect(() => blockerTitle("   ")).toThrowError(
      expect.objectContaining({ code: "rituals/invalid-blocker-title" }),
    );
  });

  it("resolves an open blocker, leaving the open list and counting as resolved (Scenario: Resolve a blocker)", () => {
    const now = new Date("2026-07-22T10:00:00Z");
    expect(resolveBlocker({ status: "Open", now })).toEqual({
      status: "Resolved",
      resolvedAt: now,
    });
  });

  it("rejects resolving a blocker that is already resolved", () => {
    expect(() =>
      resolveBlocker({ status: "Resolved", now: new Date("2026-07-22T10:00:00Z") }),
    ).toThrowError(expect.objectContaining({ code: "rituals/blocker-already-resolved" }));
  });

  it("validates the status value", () => {
    expect(blockerStatus("Open")).toBe("Open");
    expect(() => blockerStatus("Archived")).toThrowError(
      expect.objectContaining({ code: "rituals/invalid-blocker-status" }),
    );
  });
});
