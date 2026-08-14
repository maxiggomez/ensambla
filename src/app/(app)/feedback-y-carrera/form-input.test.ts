import { describe, expect, it } from "vitest";

import { parseGiveFeedbackForm, parseGiveKudoForm, parseGrowthPlanForm } from "./form-input";

describe("Feedback & Carrera FormData boundary", () => {
  it("rejects absent Feedback fields instead of coercing null", () => {
    expect(() => parseGiveFeedbackForm(new FormData())).toThrow();
  });

  it("rejects ambiguous Kudo context", () => {
    const form = new FormData();
    form.set("recipientMemberId", "member-a");
    form.set("message", "Gracias");
    form.set("value", "Ownership");
    form.set("objectiveId", "objective-a");
    form.set("keyResultId", "kr-a");
    expect(() => parseGiveKudoForm(form)).toThrow();
  });

  it("parses repeated Growth targets and rejects invalid levels", () => {
    const form = new FormData();
    form.set("nextMilestone", "Liderar un proyecto");
    form.append("skillId", "skill-a");
    form.append("targetLevel", "3");
    expect(parseGrowthPlanForm(form)).toEqual({
      nextMilestone: "Liderar un proyecto",
      targets: [{ skillId: "skill-a", targetLevel: 3 }],
    });
    form.set("targetLevel", "9");
    expect(() => parseGrowthPlanForm(form)).toThrow();
  });
});
