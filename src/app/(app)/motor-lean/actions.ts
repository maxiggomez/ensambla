"use server";

import { getAuthContext } from "@/lib/auth";
import {
  closeExperiment,
  createExperiment,
  startBuilding,
  startMeasuring,
} from "@/modules/lean-experiments/application";
import { ApplicationError, DomainError } from "@/shared/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseCloseExperimentForm,
  parseCreateExperimentForm,
  parseExperimentIdentityForm,
  parseStartMeasuringForm,
} from "./form-input";

export interface LeanFormState {
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
  action: (userId: string) => Promise<void>,
  success: string,
): Promise<LeanFormState> {
  try {
    await action(await actorId());
    revalidatePath("/motor-lean");
    return { success };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function createExperimentAction(_state: LeanFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    const input = parseCreateExperimentForm(formData);
    await createExperiment({ actorClerkUserId, ...input });
  }, "Hipótesis creada.");
}
export async function startBuildingAction(_state: LeanFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    const input = parseExperimentIdentityForm(formData);
    await startBuilding({ actorClerkUserId, ...input });
  }, "Experimento en construcción.");
}
export async function startMeasuringAction(_state: LeanFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    const input = parseStartMeasuringForm(formData);
    const measurement =
      input.measurementType === "check"
        ? { type: input.measurementType, done: input.checkDone }
        : input.measurementType === "text"
          ? { type: input.measurementType, state: input.textState }
          : {
              type: input.measurementType,
              start: input.start,
              target: input.target,
              current: input.current,
            };
    await startMeasuring({
      actorClerkUserId,
      experimentId: input.experimentId,
      measurement,
      cutoffAt: input.cutoffAt,
    });
  }, "Experimento en medición.");
}
export async function closeExperimentAction(_state: LeanFormState, formData: FormData) {
  return run(async (actorClerkUserId) => {
    const input = parseCloseExperimentForm(formData);
    await closeExperiment({ actorClerkUserId, ...input });
  }, "Aprendizaje guardado.");
}
