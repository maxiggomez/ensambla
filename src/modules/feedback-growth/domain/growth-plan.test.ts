import { describe, expect, it } from "vitest";

import { deriveGrowthProgress, parseGrowthPlan } from "./growth-plan";

describe("GrowthPlan", () => {
  it("normalizes a milestone and unique Skill targets from zero to four", () => {
    expect(
      parseGrowthPlan({
        nextMilestone: "  Liderar un proyecto end-to-end  ",
        targets: [
          { skillId: "skill-leadership", targetLevel: 3 },
          { skillId: "skill-analytics", targetLevel: 0 },
        ],
      }),
    ).toEqual({
      nextMilestone: "Liderar un proyecto end-to-end",
      targets: [
        { skillId: "skill-leadership", targetLevel: 3 },
        { skillId: "skill-analytics", targetLevel: 0 },
      ],
    });
  });

  it.each([
    { nextMilestone: " ", targets: [{ skillId: "skill-a", targetLevel: 2 }] },
    { nextMilestone: "Hito", targets: [] },
    {
      nextMilestone: "Hito",
      targets: [
        { skillId: "skill-a", targetLevel: 2 },
        { skillId: "skill-a", targetLevel: 3 },
      ],
    },
    { nextMilestone: "Hito", targets: [{ skillId: "skill-a", targetLevel: -1 }] },
    { nextMilestone: "Hito", targets: [{ skillId: "skill-a", targetLevel: 5 }] },
    { nextMilestone: "Hito", targets: [{ skillId: "skill-a", targetLevel: 1.5 }] },
  ])("rejects an invalid plan", (input) => {
    expect(() => parseGrowthPlan(input)).toThrowError(
      expect.objectContaining({ code: "feedback-growth/invalid-growth-plan" }),
    );
  });

  it("derives gaps and average progress without persisting a percentage", () => {
    expect(
      deriveGrowthProgress(
        [
          { skillId: "skill-a", targetLevel: 4 },
          { skillId: "skill-b", targetLevel: 2 },
          { skillId: "skill-c", targetLevel: 0 },
        ],
        { "skill-a": 2, "skill-b": 3 },
      ),
    ).toEqual({
      progress: 75,
      targets: [
        { skillId: "skill-a", targetLevel: 4, currentLevel: 2, gap: 2 },
        { skillId: "skill-b", targetLevel: 2, currentLevel: 3, gap: 0 },
        { skillId: "skill-c", targetLevel: 0, currentLevel: 0, gap: 0 },
      ],
    });
  });

  it("treats a plan containing only zero targets as fully satisfied", () => {
    expect(deriveGrowthProgress([{ skillId: "skill-a", targetLevel: 0 }], {})).toEqual({
      progress: 100,
      targets: [{ skillId: "skill-a", targetLevel: 0, currentLevel: 0, gap: 0 }],
    });
  });
});
