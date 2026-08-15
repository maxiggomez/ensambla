"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  applyOnboardingTemplate,
  backOnboardingSetup,
  completeOnboardingSetup,
  saveOnboardingCompanyProfile,
  skipOnboardingSetup,
  startOnboardingSetup,
} from "@/modules/onboarding-setup/application";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createOrganization } from "../../modules/identity-org/application";
import { ApplicationError, DomainError } from "../../shared/errors";

export interface CreateOrgFormState {
  error?: string;
}

export interface OnboardingFormState {
  error?: string;
}

const companyProfileSchema = z.object({
  companyType: z.string().trim().min(1, "Ingresá el tipo de empresa."),
  industry: z.string().trim().min(1, "Ingresá la industria."),
});

const onboardingTemplateSchema = z.object({
  templateKey: z.enum(["saas-product", "services-agency", "commerce-retail"], {
    error: "Elegí un template válido.",
  }),
});

const ERROR_MESSAGES: Record<string, string> = {
  "identity-org/invalid-name": "El nombre de la organización no puede estar vacío.",
  "identity-org/invalid-email": "Tu usuario no tiene un email válido.",
  "identity-org/organization-exists": "Ya pertenecés a una organización.",
};

const ONBOARDING_ERROR_MESSAGES: Record<string, string> = {
  "onboarding-setup/forbidden": "Solo Dirección puede modificar la configuración.",
  "onboarding-setup/not-found": "No encontramos la configuración inicial.",
  "onboarding-setup/stale-transition":
    "La configuración cambió al mismo tiempo. Volvé a intentarlo.",
  "onboarding-setup/template-target-not-empty":
    "Ya existe contenido en la organización. No aplicamos el template para evitar sobrescribirlo.",
  "onboarding-setup/template-already-applied":
    "La organización ya completó la configuración con otro template.",
  "onboarding-setup/concurrent-structure-change":
    "La estructura está cambiando al mismo tiempo. Volvé a intentarlo.",
};

export async function createOrganizationAction(
  _prevState: CreateOrgFormState,
  formData: FormData,
): Promise<CreateOrgFormState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  try {
    await createOrganization({
      clerkUserId: user.id,
      name: String(formData.get("name") ?? ""),
      creatorEmail: user.primaryEmailAddress?.emailAddress ?? "",
      creatorName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Sin nombre",
    });
    await startOnboardingSetup({ actorClerkUserId: user.id });
  } catch (error) {
    if (error instanceof DomainError || error instanceof ApplicationError) {
      return { error: ERROR_MESSAGES[error.code] ?? "No se pudo crear la organización." };
    }
    throw error;
  }

  redirect("/onboarding");
}

async function actorId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user.id;
}

function onboardingError(error: unknown): OnboardingFormState {
  if (error instanceof z.ZodError) {
    return { error: error.issues[0]?.message ?? "Revisá los datos ingresados." };
  }
  if (error instanceof DomainError || error instanceof ApplicationError) {
    return {
      error:
        ONBOARDING_ERROR_MESSAGES[error.code] ??
        "No pudimos guardar la configuración. Volvé a intentarlo.",
    };
  }
  return { error: "No pudimos guardar la configuración." };
}

export async function saveCompanyProfileAction(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const actorClerkUserId = await actorId();
  try {
    const profile = companyProfileSchema.parse({
      companyType: formData.get("companyType"),
      industry: formData.get("industry"),
    });
    await saveOnboardingCompanyProfile({ actorClerkUserId, ...profile });
  } catch (error) {
    return onboardingError(error);
  }
  redirect("/onboarding");
}

export async function backOnboardingAction(
  _state: OnboardingFormState,
  _formData: FormData,
): Promise<OnboardingFormState> {
  void _state;
  void _formData;
  const actorClerkUserId = await actorId();
  try {
    await backOnboardingSetup({ actorClerkUserId });
  } catch (error) {
    return onboardingError(error);
  }
  redirect("/onboarding");
}

export async function completeOnboardingAction(
  _state: OnboardingFormState,
  _formData: FormData,
): Promise<OnboardingFormState> {
  void _state;
  void _formData;
  const actorClerkUserId = await actorId();
  try {
    await completeOnboardingSetup({ actorClerkUserId });
  } catch (error) {
    return onboardingError(error);
  }
  redirect("/members");
}

export async function applyOnboardingTemplateAction(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const actorClerkUserId = await actorId();
  try {
    const { templateKey } = onboardingTemplateSchema.parse({
      templateKey: formData.get("templateKey"),
    });
    await applyOnboardingTemplate({ actorClerkUserId, templateKey });
  } catch (error) {
    return onboardingError(error);
  }
  redirect("/members");
}

export async function skipOnboardingAction(
  _state: OnboardingFormState,
  _formData: FormData,
): Promise<OnboardingFormState> {
  void _state;
  void _formData;
  const actorClerkUserId = await actorId();
  try {
    await skipOnboardingSetup({ actorClerkUserId });
  } catch (error) {
    return onboardingError(error);
  }
  redirect("/members");
}
