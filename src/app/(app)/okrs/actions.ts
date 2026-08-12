"use server";

import { getAuthContext } from "@/lib/auth";
import {
  addKeyResult,
  archiveObjective,
  carryOverKeyResult,
  closeObjective,
  configureCheckInCadence,
  createObjective,
  createOkrCycle,
  gradeKeyResult,
  linkObjectiveParent,
  MAX_EVIDENCE_FILE_BYTES,
  publishObjective,
  recordCheckIn,
  type RecordCheckInInput,
} from "@/modules/okrs/application";
import { ApplicationError, DomainError } from "@/shared/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? null : value),
  z.uuid().nullable(),
);

const actorInput = z.object({ actorClerkUserId: z.string().min(1) });
async function actorId(): Promise<string> {
  const { userId } = await getAuthContext();
  if (!userId) redirect("/sign-in");
  return actorInput.parse({ actorClerkUserId: userId }).actorClerkUserId;
}

function messageFor(error: unknown): string {
  if (error instanceof z.ZodError) return "Revisá los datos ingresados.";
  if (error instanceof DomainError || error instanceof ApplicationError) {
    const messages: Record<string, string> = {
      "okrs/forbidden": "No tenés permiso para realizar esta acción.",
      "okrs/team-required": "Elegí el Team del objetivo.",
      "okrs/objective-without-key-results": "Agregá al menos un Key Result antes de publicar.",
      "okrs/key-result-invalid": "Completá la medición del Key Result.",
      "okrs/value-type-mismatch": "El valor no coincide con el tipo de medición.",
      "okrs/ungraded-key-results": "Calificá todos los Key Results antes de cerrar.",
      "okrs/objective-read-only": "El objetivo archivado es de solo lectura.",
      "okrs/alignment-cycle": "Ese alineamiento produciría un ciclo.",
      "okrs/evidence-too-large": "El archivo no puede superar 5 MiB.",
      "okrs/invalid-evidence": "La evidencia no es válida.",
    };
    return messages[error.code] ?? "No se pudo completar la acción.";
  }
  throw error;
}

function finish(message: string, error = false): never {
  revalidatePath("/okrs");
  revalidatePath("/dashboard");
  redirect(`/okrs?${error ? "error" : "success"}=${encodeURIComponent(message)}`);
}

export async function createObjectiveAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({
        title: z.string().trim().min(1),
        level: z.enum(["Company", "Area", "Team", "Person"]),
        ownerMemberId: z.uuid(),
        teamId: optionalUuid,
        parentObjectiveId: optionalUuid,
        cycleId: optionalUuid,
      })
      .parse(Object.fromEntries(formData));
    await createObjective({ actorClerkUserId: await actorId(), ...data });
    finish("Objetivo creado en borrador.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function addKeyResultAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({
        objectiveId: z.uuid(),
        title: z.string().trim().min(1),
        measurementType: z.enum(["check", "percentage", "integer", "currency", "text"]),
        startValue: z.string().optional(),
        targetValue: z.string().optional(),
      })
      .parse(Object.fromEntries(formData));
    const numeric = ["percentage", "integer", "currency"].includes(data.measurementType);
    await addKeyResult({
      actorClerkUserId: await actorId(),
      objectiveId: data.objectiveId,
      title: data.title,
      measurementType: data.measurementType,
      startValue: numeric && data.startValue !== "" ? Number(data.startValue) : null,
      targetValue: numeric && data.targetValue !== "" ? Number(data.targetValue) : null,
    });
    finish("Key Result agregado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function publishObjectiveAction(formData: FormData): Promise<never> {
  try {
    const { objectiveId } = z
      .object({ objectiveId: z.uuid() })
      .parse(Object.fromEntries(formData));
    await publishObjective({ actorClerkUserId: await actorId(), objectiveId });
    finish("Objetivo publicado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function configureCadenceAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({ objectiveId: z.uuid(), cadence: z.enum(["Weekly", "Biweekly", "Monthly"]) })
      .parse(Object.fromEntries(formData));
    await configureCheckInCadence({ actorClerkUserId: await actorId(), ...data });
    finish("Cadencia actualizada.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function recordCheckInAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({
        keyResultId: z.uuid(),
        measurementType: z.enum(["check", "percentage", "integer", "currency", "text"]),
        value: z.string(),
        confidence: z.coerce.number().int().min(0).max(10),
        comment: z.string().optional(),
        evidenceUrl: z.string().optional(),
      })
      .parse(Object.fromEntries(formData));
    const value =
      data.measurementType === "check"
        ? data.value === "true"
        : data.measurementType === "text"
          ? data.value
          : Number(data.value);
    const evidence: NonNullable<RecordCheckInInput["evidence"]>[number][] = [];
    if (data.evidenceUrl) evidence.push({ kind: "link", url: data.evidenceUrl });
    const file = formData.get("fileEvidence");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_EVIDENCE_FILE_BYTES) {
        throw new DomainError("okrs/evidence-too-large", "Evidence file exceeds 5 MiB");
      }
      evidence.push({
        kind: "file",
        fileName: file.name,
        mediaType: file.type || "application/octet-stream",
        bytes: new Uint8Array(await file.arrayBuffer()),
      });
    }
    await recordCheckIn({
      actorClerkUserId: await actorId(),
      keyResultId: data.keyResultId,
      value,
      confidence: data.confidence,
      comment: data.comment,
      evidence,
    });
    finish("Check-in registrado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function createCycleAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({
        name: z.string().trim().min(1),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
      })
      .parse(Object.fromEntries(formData));
    await createOkrCycle({ actorClerkUserId: await actorId(), ...data });
    finish("Ciclo creado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function linkParentAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({ objectiveId: z.uuid(), parentObjectiveId: z.uuid() })
      .parse(Object.fromEntries(formData));
    await linkObjectiveParent({ actorClerkUserId: await actorId(), ...data });
    finish("Alineamiento actualizado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function gradeKeyResultAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({ keyResultId: z.uuid(), grade: z.enum(["Achieved", "Partial", "NotAchieved"]) })
      .parse(Object.fromEntries(formData));
    await gradeKeyResult({ actorClerkUserId: await actorId(), ...data });
    finish("Key Result calificado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function closeObjectiveAction(formData: FormData): Promise<never> {
  try {
    const { objectiveId } = z
      .object({ objectiveId: z.uuid() })
      .parse(Object.fromEntries(formData));
    await closeObjective({ actorClerkUserId: await actorId(), objectiveId });
    finish("Objetivo cerrado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function archiveObjectiveAction(formData: FormData): Promise<never> {
  try {
    const { objectiveId } = z
      .object({ objectiveId: z.uuid() })
      .parse(Object.fromEntries(formData));
    await archiveObjective({ actorClerkUserId: await actorId(), objectiveId });
    finish("Objetivo archivado.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}

export async function carryOverAction(formData: FormData): Promise<never> {
  try {
    const data = z
      .object({ keyResultId: z.uuid(), destinationCycleId: z.uuid() })
      .parse(Object.fromEntries(formData));
    await carryOverKeyResult({ actorClerkUserId: await actorId(), ...data });
    finish("Key Result trasladado al ciclo siguiente.");
  } catch (error) {
    finish(messageFor(error), true);
  }
}
