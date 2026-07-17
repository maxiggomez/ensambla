import { describe, expect, it } from "vitest";

import { evaluateAlignment } from "./alignment";

describe("alignment (Projects ↔ OKRs)", () => {
  const objectives = [
    { objectiveId: "obj-1", status: "Published" as const, keyResultIds: ["kr-1", "kr-2"] },
    { objectiveId: "obj-2", status: "Published" as const, keyResultIds: ["kr-3"] },
    { objectiveId: "obj-3", status: "Draft" as const, keyResultIds: ["kr-4"] },
  ];

  it("a project with no linked objective raises a 'project without OKR' alert", () => {
    const result = evaluateAlignment(
      [
        { projectId: "p-1", objectiveIds: ["obj-1"] },
        { projectId: "p-2", objectiveIds: [] },
      ],
      objectives,
    );
    expect(result.projectsWithoutOkr).toEqual(["p-2"]);
  });

  it("key results of published objectives with no project are a misalignment risk", () => {
    const result = evaluateAlignment(
      [{ projectId: "p-1", objectiveIds: ["obj-1"] }],
      objectives,
    );
    // obj-2 está publicado y sin Project → sus KRs son riesgo; obj-1 cubierto.
    expect(result.keyResultsWithoutProject).toEqual(["kr-3"]);
  });

  it("draft objectives do not raise risks; fully covered orgs raise nothing", () => {
    const covered = evaluateAlignment(
      [
        { projectId: "p-1", objectiveIds: ["obj-1"] },
        { projectId: "p-2", objectiveIds: ["obj-2"] },
      ],
      objectives,
    );
    expect(covered.projectsWithoutOkr).toEqual([]);
    expect(covered.keyResultsWithoutProject).toEqual([]);
  });
});
