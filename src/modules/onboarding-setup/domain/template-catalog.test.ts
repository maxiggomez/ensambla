import { describe, expect, it } from "vitest";

import { onboardingTemplateCatalog, recommendOnboardingTemplate } from "./template-catalog";

describe("onboarding template catalog", () => {
  it.each([
    [{ companyType: "Producto", industry: "Tecnología" }, "saas-product"],
    [{ companyType: "Servicios profesionales", industry: "Marketing" }, "services-agency"],
    [{ companyType: "Comercio", industry: "Retail" }, "commerce-retail"],
  ] as const)("matches a saved company profile", (profile, expectedKey) => {
    expect(recommendOnboardingTemplate(profile).key).toBe(expectedKey);
  });

  it("uses the same stable fallback for an unknown profile", () => {
    const profile = { companyType: "Cooperativa", industry: "Biotecnología" };

    expect(recommendOnboardingTemplate(profile).key).toBe("services-agency");
    expect(recommendOnboardingTemplate(profile)).toBe(recommendOnboardingTemplate(profile));
  });

  it("exposes stable unique keys for the initial product catalog", () => {
    expect(onboardingTemplateCatalog.map(({ key }) => key)).toEqual([
      "saas-product",
      "services-agency",
      "commerce-retail",
    ]);
    expect(new Set(onboardingTemplateCatalog.map(({ key }) => key)).size).toBe(
      onboardingTemplateCatalog.length,
    );
  });

  it.each(onboardingTemplateCatalog)("$key has a complete preview blueprint", (template) => {
    expect(template.name).not.toHaveLength(0);
    expect(template.description).not.toHaveLength(0);
    expect(template.teams.length).toBeGreaterThan(0);
    expect(template.northStar.name).not.toHaveLength(0);
    expect(template.northStar.measurement).toEqual(
      expect.objectContaining({ type: expect.any(String) }),
    );
    expect(template.objectives.length).toBeGreaterThan(0);
    expect(
      template.objectives.every(
        (objective) => objective.title.length > 0 && objective.keyResults.length > 0,
      ),
    ).toBe(true);
    expect(template.skills.length).toBeGreaterThan(0);
  });
});
