import type { TenantClient } from "../../../shared/db";
import { columnFromMeasurementKind, columnFromTextState } from "../../../shared/measurement";
import type { CheckInEvidenceInput } from "../domain/check-in";
import type { KeyResultValues } from "../domain/key-result";

export interface InsertCheckInInput {
  id: string;
  organizationId: string;
  keyResultId: string;
  actorMemberId: string;
  values: KeyResultValues;
  confidence: number;
  comment: string | null;
  evidence: readonly (CheckInEvidenceInput & { id: string })[];
}

export async function insertCheckIn(
  tx: TenantClient,
  input: InsertCheckInInput,
): Promise<void> {
  await tx.checkIn.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      keyResultId: input.keyResultId,
      actorMemberId: input.actorMemberId,
      measurementType: columnFromMeasurementKind(input.values.measurementType),
      numericValue: input.values.currentValue ?? null,
      checkDone: input.values.checkDone ?? null,
      textState:
        input.values.textState == null ? null : columnFromTextState(input.values.textState),
      confidence: input.confidence,
      comment: input.comment,
    },
  });
  await tx.checkInEvidence.createMany({
    data: input.evidence.map((evidence) =>
      evidence.kind === "link"
        ? {
            id: evidence.id,
            organizationId: input.organizationId,
            checkInId: input.id,
            kind: "Link" as const,
            url: evidence.url,
          }
        : {
            id: evidence.id,
            organizationId: input.organizationId,
            checkInId: input.id,
            kind: "File" as const,
            fileName: evidence.fileName,
            mediaType: evidence.mediaType,
            sizeBytes: evidence.bytes.byteLength,
            fileBytes: Uint8Array.from(evidence.bytes),
          },
    ),
  });
}

export function listKeyResultsWithLatestCheckIn(tx: TenantClient) {
  return tx.keyResult.findMany({
    include: {
      objective: true,
      checkIns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
