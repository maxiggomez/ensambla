import { canEditOrganization, requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import {
  backToCompanyProfile,
  completeSetup,
  saveCompanyProfile,
  skipSetup,
  type OnboardingSetupProgress,
} from "../domain/setup-progress";
import {
  compareAndSetSetup,
  findSetup,
  upsertInitialSetup,
} from "../infrastructure/setup-repo";

export interface OnboardingActorInput {
  actorClerkUserId: string;
}

export interface SaveOnboardingCompanyProfileInput extends OnboardingActorInput {
  companyType: string;
  industry: string;
}

export type OnboardingSetupView = OnboardingSetupProgress;

export interface OnboardingSetupAccess {
  canMutate: boolean;
  setup: OnboardingSetupView | null;
}

function viewOf(row: {
  status: OnboardingSetupProgress["status"];
  currentStep: OnboardingSetupProgress["currentStep"];
  companyType: string | null;
  industry: string | null;
}): OnboardingSetupView {
  return {
    status: row.status,
    currentStep: row.currentStep,
    companyType: row.companyType,
    industry: row.industry,
  };
}

function forbidden(): ApplicationError {
  return new ApplicationError(
    "onboarding-setup/forbidden",
    "Only Dirección can mutate onboarding setup",
  );
}

function missingSetup(): ApplicationError {
  return new ApplicationError(
    "onboarding-setup/not-found",
    "Onboarding setup has not been started",
  );
}

function staleSetup(): ApplicationError {
  return new ApplicationError(
    "onboarding-setup/stale-transition",
    "Onboarding setup changed concurrently",
  );
}

async function withDirectionSetup(
  input: OnboardingActorInput,
  mutate: (progress: OnboardingSetupProgress) => OnboardingSetupProgress,
  client: PrismaClient,
): Promise<OnboardingSetupView> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) throw forbidden();
      const row = await findSetup(tx, actor.organizationId);
      if (!row) throw missingSetup();
      const current = viewOf(row);
      const changed = await compareAndSetSetup(
        tx,
        actor.organizationId,
        current,
        mutate(current),
      );
      if (!changed) throw staleSetup();
      return viewOf(changed);
    },
    client,
  );
}

export async function getOnboardingSetupAccess(
  input: OnboardingActorInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupAccess> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const row = await findSetup(tx, actor.organizationId);
      return {
        canMutate: canEditOrganization(actor.role),
        setup: row ? viewOf(row) : null,
      };
    },
    client,
  );
}

export async function getOnboardingSetup(
  input: OnboardingActorInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView | null> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const row = await findSetup(tx, actor.organizationId);
      return row ? viewOf(row) : null;
    },
    client,
  );
}

export async function startOnboardingSetup(
  input: OnboardingActorInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) throw forbidden();
      return viewOf(await upsertInitialSetup(tx, actor.organizationId));
    },
    client,
  );
}

export function saveOnboardingCompanyProfile(
  input: SaveOnboardingCompanyProfileInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView> {
  return withDirectionSetup(input, (progress) => saveCompanyProfile(progress, input), client);
}

export function backOnboardingSetup(
  input: OnboardingActorInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView> {
  return withDirectionSetup(input, backToCompanyProfile, client);
}

export function completeOnboardingSetup(
  input: OnboardingActorInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView> {
  return withDirectionSetup(input, completeSetup, client);
}

export function skipOnboardingSetup(
  input: OnboardingActorInput,
  client: PrismaClient = prismaClient(),
): Promise<OnboardingSetupView> {
  return withDirectionSetup(input, skipSetup, client);
}
