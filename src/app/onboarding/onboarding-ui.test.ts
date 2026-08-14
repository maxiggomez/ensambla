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
    expect(form).toContain("Finalizar configuración");
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
});
