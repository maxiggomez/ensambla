import { DomainError } from "../../../shared/errors";

import type { OnboardingTemplateKey } from "./template-catalog";

export type OnboardingSetupStatus = "Pending" | "Completed" | "Skipped";
export type OnboardingSetupStep = "CompanyProfile" | "Review";

export interface OnboardingSetupProgress {
  status: OnboardingSetupStatus;
  currentStep: OnboardingSetupStep;
  companyType: string | null;
  industry: string | null;
  appliedTemplateKey: OnboardingTemplateKey | null;
}

export interface CompanyProfileInput {
  companyType: string;
  industry: string;
}

export function initialSetupProgress(): OnboardingSetupProgress {
  return {
    status: "Pending",
    currentStep: "CompanyProfile",
    companyType: null,
    industry: null,
    appliedTemplateKey: null,
  };
}

function assertPending(progress: OnboardingSetupProgress): void {
  if (progress.status !== "Pending") {
    throw new DomainError(
      "onboarding-setup/setup-terminal",
      "Completed or skipped setup cannot be changed",
    );
  }
}

function normalizedProfile(input: CompanyProfileInput): CompanyProfileInput {
  const companyType = input.companyType.trim();
  const industry = input.industry.trim();
  if (!companyType || !industry) {
    throw new DomainError(
      "onboarding-setup/profile-required",
      "Company type and industry are required",
    );
  }
  return { companyType, industry };
}

export function saveCompanyProfile(
  progress: OnboardingSetupProgress,
  input: CompanyProfileInput,
): OnboardingSetupProgress {
  assertPending(progress);
  const profile = normalizedProfile(input);
  return { ...progress, ...profile, currentStep: "Review" };
}

export function backToCompanyProfile(
  progress: OnboardingSetupProgress,
): OnboardingSetupProgress {
  assertPending(progress);
  if (progress.currentStep !== "Review") {
    throw new DomainError(
      "onboarding-setup/invalid-transition",
      "Setup can go back only from review",
    );
  }
  return { ...progress, currentStep: "CompanyProfile" };
}

export function completeSetup(progress: OnboardingSetupProgress): OnboardingSetupProgress {
  assertPending(progress);
  if (progress.currentStep !== "Review" || !progress.companyType || !progress.industry) {
    throw new DomainError(
      "onboarding-setup/invalid-transition",
      "Setup can be completed only from review with a valid profile",
    );
  }
  return { ...progress, status: "Completed", appliedTemplateKey: null };
}

export function applySetupTemplate(
  progress: OnboardingSetupProgress,
  templateKey: OnboardingTemplateKey,
): OnboardingSetupProgress {
  if (progress.status === "Completed" && progress.appliedTemplateKey === templateKey) {
    return progress;
  }
  if (progress.status === "Completed" && progress.appliedTemplateKey !== null) {
    throw new DomainError(
      "onboarding-setup/template-already-applied",
      "A different onboarding template was already applied",
    );
  }
  assertPending(progress);
  if (progress.currentStep !== "Review" || !progress.companyType || !progress.industry) {
    throw new DomainError(
      "onboarding-setup/invalid-transition",
      "A template can be applied only from review with a valid profile",
    );
  }
  return { ...progress, status: "Completed", appliedTemplateKey: templateKey };
}

export function skipSetup(progress: OnboardingSetupProgress): OnboardingSetupProgress {
  assertPending(progress);
  return { ...progress, status: "Skipped" };
}
