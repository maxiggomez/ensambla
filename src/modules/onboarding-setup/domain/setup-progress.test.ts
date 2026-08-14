import { describe, expect, it } from "vitest";

import { DomainError } from "../../../shared/errors";

import {
  backToCompanyProfile,
  completeSetup,
  initialSetupProgress,
  saveCompanyProfile,
  skipSetup,
} from "./setup-progress";

describe("OnboardingSetup progress", () => {
  it("starts pending at the company profile step", () => {
    expect(initialSetupProgress()).toEqual({
      status: "Pending",
      currentStep: "CompanyProfile",
      companyType: null,
      industry: null,
    });
  });

  it("normalizes a valid profile and advances to review", () => {
    expect(
      saveCompanyProfile(initialSetupProgress(), {
        companyType: "  Servicios profesionales  ",
        industry: "  Tecnología  ",
      }),
    ).toEqual({
      status: "Pending",
      currentStep: "Review",
      companyType: "Servicios profesionales",
      industry: "Tecnología",
    });
  });

  it.each([
    { companyType: "", industry: "Tecnología" },
    { companyType: "Servicios", industry: "   " },
  ])("rejects an incomplete company profile", (profile) => {
    expect(() => saveCompanyProfile(initialSetupProgress(), profile)).toThrowError(
      new DomainError(
        "onboarding-setup/profile-required",
        "Company type and industry are required",
      ),
    );
  });

  it("goes back without losing the saved profile", () => {
    const review = saveCompanyProfile(initialSetupProgress(), {
      companyType: "Producto",
      industry: "Finanzas",
    });

    expect(backToCompanyProfile(review)).toEqual({
      ...review,
      currentStep: "CompanyProfile",
    });
  });

  it("completes only from review with a valid persisted profile", () => {
    const review = saveCompanyProfile(initialSetupProgress(), {
      companyType: "Producto",
      industry: "Finanzas",
    });

    expect(completeSetup(review)).toEqual({ ...review, status: "Completed" });
    expect(() => completeSetup(initialSetupProgress())).toThrowError(
      expect.objectContaining({ code: "onboarding-setup/invalid-transition" }),
    );
  });

  it("skips a pending setup without fabricating profile data", () => {
    expect(skipSetup(initialSetupProgress())).toEqual({
      status: "Skipped",
      currentStep: "CompanyProfile",
      companyType: null,
      industry: null,
    });
  });

  it.each(["Completed", "Skipped"] as const)(
    "keeps %s progress terminal and immutable",
    (status) => {
      const terminal = { ...initialSetupProgress(), status };

      expect(() =>
        saveCompanyProfile(terminal, { companyType: "Producto", industry: "Finanzas" }),
      ).toThrowError(expect.objectContaining({ code: "onboarding-setup/setup-terminal" }));
      expect(() => skipSetup(terminal)).toThrowError(
        expect.objectContaining({ code: "onboarding-setup/setup-terminal" }),
      );
    },
  );
});
