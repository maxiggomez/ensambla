import { describe, expect, it } from "vitest";

import { groupCommentsByDriver } from "./drivers";

describe("anonymous comment drivers", () => {
  it("groups open comments by selected theme without response metadata", () => {
    const groups = groupCommentsByDriver([
      {
        driver: "Workload",
        comment: "Tenemos demasiados frentes abiertos",
        responseId: "response-1",
        submittedAt: new Date("2026-08-04T10:00:00Z"),
      },
      {
        driver: "Recognition",
        comment: "Se reconocen los logros",
        responseId: "response-2",
        submittedAt: new Date("2026-08-04T11:00:00Z"),
      },
      {
        driver: "Workload",
        comment: "Falta foco",
        responseId: "response-3",
        submittedAt: new Date("2026-08-04T12:00:00Z"),
      },
      { driver: "Workload", comment: null, responseId: "response-4" },
    ]);

    expect(groups).toEqual([
      {
        driver: "Recognition",
        count: 1,
        comments: ["Se reconocen los logros"],
      },
      {
        driver: "Workload",
        count: 3,
        comments: ["Tenemos demasiados frentes abiertos", "Falta foco"],
      },
    ]);
    expect(JSON.stringify(groups)).not.toContain("response-");
    expect(JSON.stringify(groups)).not.toContain("submittedAt");
    expect(JSON.stringify(groups)).not.toContain("member");
  });
});
