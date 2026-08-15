import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8");

describe("guided onboarding UI", () => {
  it("keeps Organization creation and adds Spanish profile and review steps", () => {
    const page = source("page.tsx");
    const form = source("guided-setup-form.tsx");

    expect(page).toContain("CreateOrgForm");
    expect(page).toContain("GuidedSetupForm");
    expect(form).toContain("Contanos sobre tu empresa");
    expect(form).toContain("Tipo de empresa");
    expect(form).toContain("Industria");
    expect(form).toContain("Revisá tu configuración");
  });

  it("exposes accessible Back, Skip and Finish actions with persisted defaults", () => {
    const form = source("guided-setup-form.tsx");

    expect(form).toContain('defaultValue={setup.companyType ?? ""}');
    expect(form).toContain('defaultValue={setup.industry ?? ""}');
    expect(form).toContain("Volver");
    expect(form).toContain("Saltar configuración");
    expect(form).toContain("Finalizar sin template");
    expect(form).toContain('role="alert"');
  });

  it("uses the onboarding public contract, Zod boundaries and Radar loading/error states", () => {
    const page = source("page.tsx");
    const actions = source("actions.ts");
    const loading = source("loading.tsx");
    const error = source("error.tsx");

    expect(page).toContain("@/modules/onboarding-setup/application");
    expect(page).toContain("getOnboardingSetupAccess");
    expect(page).toContain("if (!access.canMutate) redirect");
    expect(actions).toContain("@/modules/onboarding-setup/application");
    expect(actions).toContain('from "zod"');
    expect(actions).toContain("const actorClerkUserId = await actorId()");
    expect(loading).toContain("animate-pulse");
    expect(error).toContain("No pudimos cargar la configuración");
    expect(error).toContain("Intentar de nuevo");
  });

  it("renders recommendation cards with an accessible write-free preview", () => {
    const page = source("page.tsx");
    const form = source("guided-setup-form.tsx");

    expect(page).toContain("getOnboardingTemplateOptions");
    expect(page).toContain("templateOptions");
    expect(form).toContain("Template recomendado");
    expect(form).toContain("Ver estructura");
    expect(form).toContain("Teams");
    expect(form).toContain("North Star");
    expect(form).toContain("Objectives y Key Results");
    expect(form).toContain("objective.keyResults.map");
    expect(form).toContain("Skills");
  });

  it("requires explicit application and preserves finish-without-template states", () => {
    const actions = source("actions.ts");
    const form = source("guided-setup-form.tsx");

    expect(actions).toContain("onboardingTemplateSchema.parse");
    expect(actions).toContain("applyOnboardingTemplate");
    expect(form).toContain("Aplicar template");
    expect(form).toContain("Aplicando…");
    expect(form).toContain("Finalizar sin template");
    expect(form).toContain('role="alert"');
  });
});
