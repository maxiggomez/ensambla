"use server";

import { getAuthContext } from "@/lib/auth";
import {
  createRitual,
  evaluateRitualStatus,
  generateRitualOccurrences,
  markRitualHeld,
  recordBlocker,
  recordRetrospective,
  resolveBlocker,
} from "@/modules/rituals/application";
import { ApplicationError, DomainError } from "@/shared/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseCreateRitualForm,
  parseEvaluateRitualStatusForm,
  parseGenerateOccurrencesForm,
  parseMarkHeldForm,
  parseRecordBlockerForm,
  parseRecordRetrospectiveForm,
  parseResolveBlockerForm,
} from "./form-input";

export interface RitualsFormState {
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
): Promise<RitualsFormState> {
  try {
    await action(await actorId());
    revalidatePath("/rituales");
    return { success };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function createRitualAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { teamId, name, cadence, startDate } = parseCreateRitualForm(formData);
    await createRitual({
      actorClerkUserId,
      teamId,
      name,
      cadence,
      startDate: new Date(`${startDate}T00:00:00.000Z`),
    });
  }, "Ceremonia creada.");
}

export async function generateOccurrencesAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { ritualId } = parseGenerateOccurrencesForm(formData);
    await generateRitualOccurrences({
      actorClerkUserId,
      ritualId,
      throughDate: new Date(),
    });
  }, "Ocurrencias generadas.");
}

export async function evaluateRitualStatusAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { ritualId } = parseEvaluateRitualStatusForm(formData);
    await evaluateRitualStatus({ actorClerkUserId, ritualId });
  }, "Estado evaluado.");
}

export async function markHeldAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { occurrenceId } = parseMarkHeldForm(formData);
    await markRitualHeld({ actorClerkUserId, occurrenceId });
  }, "Ocurrencia marcada como realizada.");
}

export async function recordBlockerAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { teamId, title, description, objectiveId } = parseRecordBlockerForm(formData);
    await recordBlocker({
      actorClerkUserId,
      teamId,
      title,
      description: description || null,
      objectiveId: objectiveId || null,
    });
  }, "Bloqueo registrado.");
}

export async function resolveBlockerAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { blockerId } = parseResolveBlockerForm(formData);
    await resolveBlocker({ actorClerkUserId, blockerId });
  }, "Bloqueo resuelto.");
}

export async function recordRetrospectiveAction(
  _state: RitualsFormState,
  formData: FormData,
): Promise<RitualsFormState> {
  return run(async (actorClerkUserId) => {
    const { teamId } = parseRecordRetrospectiveForm(formData);
    await recordRetrospective({ actorClerkUserId, teamId });
  }, "Retrospectiva registrada.");
}
