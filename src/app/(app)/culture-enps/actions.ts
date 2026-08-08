"use server";

import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  configureMinimumResponses,
  configurePulseSchedule,
  DRIVERS,
  launchPulse,
  submitPulseResponse,
  type Driver,
  type PulseFrequency,
} from "@/modules/culture-enps/application";
import { ApplicationError, DomainError } from "@/shared/errors";

export interface CultureFormState {
  error?: string;
  success?: string;
}

async function actorId(): Promise<string> {
  const { userId } = await getAuthContext();
  if (!userId) redirect("/sign-in");
  return userId;
}

function messageFor(error: unknown): string {
  if (error instanceof DomainError || error instanceof ApplicationError) {
    const messages: Record<string, string> = {
      "culture-enps/forbidden": "Solo Dirección puede realizar esta acción.",
      "culture-enps/already-responded": "Este pulso ya fue respondido.",
      "culture-enps/not-a-recipient": "Este pulso no está asignado a tu persona.",
      "culture-enps/invalid-minimum-responses": "El mínimo debe ser un entero entre 4 y 100.",
      "culture-enps/invalid-score": "Elegí un valor entre 0 y 10.",
    };
    return messages[error.code] ?? "No se pudo completar la acción.";
  }
  throw error;
}

export async function launchPulseAction(
  _state: CultureFormState,
  formData: FormData,
): Promise<CultureFormState> {
  try {
    const userId = await actorId();
    const teamId = String(formData.get("teamId") ?? "");
    await launchPulse({
      actorClerkUserId: userId,
      scope: teamId ? { type: "team", teamId } : { type: "organization" },
    });
    revalidatePath("/culture-enps");
    return { success: "Pulso lanzado." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function submitPulseResponseAction(
  _state: CultureFormState,
  formData: FormData,
): Promise<CultureFormState> {
  const driver = String(formData.get("driver") ?? "");
  if (!(DRIVERS as readonly string[]).includes(driver)) return { error: "Elegí un driver." };
  try {
    const userId = await actorId();
    await submitPulseResponse({
      actorClerkUserId: userId,
      pulseId: String(formData.get("pulseId") ?? ""),
      score: Number(formData.get("score")),
      driver: driver as Driver,
      comment: String(formData.get("comment") ?? ""),
    });
    revalidatePath("/culture-enps");
    return { success: "Respuesta enviada de forma anónima." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function configureMinimumResponsesAction(
  _state: CultureFormState,
  formData: FormData,
): Promise<CultureFormState> {
  try {
    const userId = await actorId();
    await configureMinimumResponses({
      actorClerkUserId: userId,
      minimumResponses: Number(formData.get("minimumResponses")),
    });
    revalidatePath("/culture-enps");
    return { success: "Umbral actualizado." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function configurePulseScheduleAction(
  _state: CultureFormState,
  formData: FormData,
): Promise<CultureFormState> {
  try {
    const userId = await actorId();
    await configurePulseSchedule({
      actorClerkUserId: userId,
      scope: { type: "organization" },
      frequency: String(formData.get("frequency")) as PulseFrequency,
      nextRunAt: new Date(String(formData.get("nextRunAt"))),
    });
    revalidatePath("/culture-enps");
    return { success: "Recurrencia configurada." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
