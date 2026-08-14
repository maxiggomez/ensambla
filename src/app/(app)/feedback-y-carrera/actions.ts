"use server";

import { getAuthContext } from "@/lib/auth";
import {
  addGrowthEvidence,
  defineGrowthPlan,
  giveFeedback,
  giveKudo,
  requestFeedback,
} from "@/modules/feedback-growth/application";
import { closeProject } from "@/modules/teams-staffing/application";
import { ApplicationError, DomainError } from "@/shared/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseGiveFeedbackForm,
  parseGiveKudoForm,
  parseGrowthEvidenceForm,
  parseGrowthPlanForm,
  parseProjectIdentityForm,
  parseRequestFeedbackForm,
} from "./form-input";

export interface FeedbackGrowthFormState {
  error?: string;
  success?: string;
}

async function actorId(): Promise<string> {
  const { userId } = await getAuthContext();
  if (!userId) redirect("/sign-in");
  return userId;
}

function messageFor(error: unknown): string {
  if (error instanceof DomainError || error instanceof ApplicationError) return error.message;
  return "No se pudo completar la acción";
}

async function run(
  action: (actorClerkUserId: string) => Promise<void>,
  success: string,
): Promise<FeedbackGrowthFormState> {
  try {
    await action(await actorId());
    revalidatePath("/feedback-y-carrera");
    return { success };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function requestFeedbackAction(
  _state: FeedbackGrowthFormState,
  formData: FormData,
) {
  return run(async (actorClerkUserId) => {
    await requestFeedback({ actorClerkUserId, ...parseRequestFeedbackForm(formData) });
  }, "Solicitud enviada.");
}

export async function giveFeedbackAction(_state: FeedbackGrowthFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    await giveFeedback({ actorClerkUserId, ...parseGiveFeedbackForm(formData) });
  }, "Feedback enviado en privado.");
}

export async function giveKudoAction(_state: FeedbackGrowthFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    await giveKudo({ actorClerkUserId, ...parseGiveKudoForm(formData) });
  }, "Reconocimiento publicado.");
}

export async function defineGrowthPlanAction(
  _state: FeedbackGrowthFormState,
  formData: FormData,
) {
  return run(async (actorClerkUserId) => {
    await defineGrowthPlan({ actorClerkUserId, ...parseGrowthPlanForm(formData) });
  }, "Plan de crecimiento actualizado.");
}

export async function addGrowthEvidenceAction(
  _state: FeedbackGrowthFormState,
  formData: FormData,
) {
  return run(async (actorClerkUserId) => {
    await addGrowthEvidence({ actorClerkUserId, ...parseGrowthEvidenceForm(formData) });
  }, "Evidencia agregada.");
}

export async function closeProjectAction(_state: FeedbackGrowthFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    await closeProject({ actorClerkUserId, ...parseProjectIdentityForm(formData) });
  }, "Proyecto cerrado.");
}
