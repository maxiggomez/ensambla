"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth";

import {
  addInputLever,
  assignObjectiveToPillar,
  createStrategicPillar,
  defineNorthStar,
  defineStrategy,
} from "../../../modules/strategy-northstar/application";
import { ApplicationError, DomainError } from "../../../shared/errors";
import type { Measurement } from "../../../shared/measurement";

export interface StrategyFormState {
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
      "strategy-northstar/forbidden": "Solo Dirección puede realizar esta acción.",
      "strategy-northstar/no-north-star": "Primero definí la North Star.",
      "strategy-northstar/objective-not-found": "El objetivo no existe en tu organización.",
      "strategy-northstar/pillar-not-found": "El pilar no existe en tu organización.",
      "strategy-northstar/already-assigned": "Este objetivo ya está en ese pilar.",
      "strategy-northstar/invalid-name": "El nombre no puede estar vacío.",
      "strategy-northstar/invalid-vision": "La visión no puede estar vacía.",
      "strategy-northstar/invalid-mission": "La misión no puede estar vacía.",
      "strategy-northstar/invalid-value": "Los valores no pueden estar vacíos.",
      "strategy-northstar/invalid-measurement": "La medición no es válida.",
      "strategy-northstar/invalid-lever-name": "El nombre del lever no puede estar vacío.",
      "strategy-northstar/invalid-pillar-name": "El nombre del pilar no puede estar vacío.",
    };
    return messages[error.code] ?? "No se pudo completar la acción.";
  }
  throw error;
}

function revalidate() {
  revalidatePath("/strategy-northstar");
}

export async function defineStrategyAction(
  _state: StrategyFormState,
  formData: FormData,
): Promise<StrategyFormState> {
  try {
    const userId = await actorId();
    const values = String(formData.get("values") ?? "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    await defineStrategy({
      actorClerkUserId: userId,
      vision: String(formData.get("vision") ?? "") || null,
      mission: String(formData.get("mission") ?? "") || null,
      values,
    });
    revalidate();
    return { success: "Estrategia guardada." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function defineNorthStarAction(
  _state: StrategyFormState,
  formData: FormData,
): Promise<StrategyFormState> {
  try {
    const userId = await actorId();
    const type = String(formData.get("measurementType"));
    const measurement = readMeasurement(type, formData);
    await defineNorthStar({
      actorClerkUserId: userId,
      name: String(formData.get("name") ?? ""),
      measurement,
    });
    revalidate();
    return { success: "North Star guardada." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

function readMeasurement(type: string, formData: FormData): Measurement {
  switch (type) {
    case "check":
      return { type: "check", done: formData.get("done") === "on" };
    case "text":
      return {
        type: "text",
        state: String(formData.get("textState")) as Measurement extends { type: "text" }
          ? Measurement["state"]
          : never,
      };
    case "percentage":
    case "integer":
    case "currency":
      return {
        type,
        start: Number(formData.get("start")),
        target: Number(formData.get("target")),
        current: Number(formData.get("current")),
      };
    default:
      throw new DomainError(
        "strategy-northstar/invalid-measurement",
        `Unknown measurement type: ${type}`,
      );
  }
}

export async function addInputLeverAction(
  _state: StrategyFormState,
  formData: FormData,
): Promise<StrategyFormState> {
  try {
    const userId = await actorId();
    const objectiveId = String(formData.get("objectiveId") ?? "");
    await addInputLever({
      actorClerkUserId: userId,
      name: String(formData.get("name") ?? ""),
      objectiveId: objectiveId === "" ? null : objectiveId,
    });
    revalidate();
    return { success: "Lever agregado." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function createStrategicPillarAction(
  _state: StrategyFormState,
  formData: FormData,
): Promise<StrategyFormState> {
  try {
    const userId = await actorId();
    await createStrategicPillar({
      actorClerkUserId: userId,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
    });
    revalidate();
    return { success: "Pilar creado." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function assignObjectiveToPillarAction(
  _state: StrategyFormState,
  formData: FormData,
): Promise<StrategyFormState> {
  try {
    const userId = await actorId();
    const objectiveId = String(formData.get("objectiveId") ?? "");
    if (objectiveId === "") {
      return { error: "Elegí un objetivo." };
    }
    await assignObjectiveToPillar({
      actorClerkUserId: userId,
      pillarId: String(formData.get("pillarId") ?? ""),
      objectiveId,
    });
    revalidate();
    return { success: "Objetivo asignado al pilar." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
