import { randomUUID } from "node:crypto";

import type { OnboardingSetupModel } from "../../../shared/db/generated/models";
import type { TenantClient } from "../../../shared/db";

import type { OnboardingSetupProgress } from "../domain/setup-progress";

export function findSetup(tx: TenantClient, organizationId: string) {
  return tx.onboardingSetup.findUnique({ where: { organizationId } });
}

export function upsertInitialSetup(tx: TenantClient, organizationId: string) {
  return tx.onboardingSetup.upsert({
    where: { organizationId },
    create: { id: randomUUID(), organizationId },
    update: {},
  });
}

export async function compareAndSetSetup(
  tx: TenantClient,
  organizationId: string,
  expected: OnboardingSetupProgress,
  progress: OnboardingSetupProgress,
): Promise<OnboardingSetupModel | null> {
  const changed = await tx.onboardingSetup.updateMany({
    where: {
      organizationId,
      status: expected.status,
      currentStep: expected.currentStep,
      companyType: expected.companyType,
      industry: expected.industry,
      appliedTemplateKey: expected.appliedTemplateKey,
    },
    data: {
      status: progress.status,
      currentStep: progress.currentStep,
      companyType: progress.companyType,
      industry: progress.industry,
      appliedTemplateKey: progress.appliedTemplateKey,
    },
  });
  if (changed.count !== 1) return null;
  return tx.onboardingSetup.findUniqueOrThrow({ where: { organizationId } });
}
