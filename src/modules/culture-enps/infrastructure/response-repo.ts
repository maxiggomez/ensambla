import type { TenantClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { measurementToColumns } from "../../../shared/measurement";
import type { PulseScope } from "../domain/pulse";
import type { AnonymousPulseResponse } from "../domain/pulse-response";

export interface PendingPulseRow {
  pulseId: string;
  scope: PulseScope;
}

export async function listPendingPulseRows(
  tx: TenantClient,
  memberId: string,
): Promise<PendingPulseRow[]> {
  const participations = await tx.pulseParticipation.findMany({
    where: { memberId, responded: false },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (participations.length === 0) return [];
  const pulses = await tx.pulse.findMany({
    where: { id: { in: participations.map((row) => row.pulseId) }, status: "Open" },
  });
  const byId = new Map(pulses.map((pulse) => [pulse.id, pulse]));
  return participations.flatMap((participation) => {
    const pulse = byId.get(participation.pulseId);
    if (!pulse) return [];
    return [
      {
        pulseId: pulse.id,
        scope:
          pulse.scope === "Organization"
            ? ({ type: "organization" } as const)
            : ({ type: "team", teamId: pulse.teamId! } as const),
      },
    ];
  });
}

export async function storeAnonymousResponse(
  tx: TenantClient,
  input: {
    organizationId: string;
    memberId: string;
    pulseId: string;
    response: AnonymousPulseResponse;
    submittedAt: Date;
  },
): Promise<void> {
  const participation = await tx.pulseParticipation.findUnique({
    where: { pulseId_memberId: { pulseId: input.pulseId, memberId: input.memberId } },
  });
  if (!participation) {
    throw new ApplicationError(
      "culture-enps/not-a-recipient",
      "The actor is not a recipient of this pulse",
    );
  }
  if (participation.responded) {
    throw new ApplicationError(
      "culture-enps/already-responded",
      "This pulse was already answered",
    );
  }
  const pulse = await tx.pulse.findUnique({ where: { id: input.pulseId } });
  if (!pulse || pulse.status !== "Open") {
    throw new ApplicationError("culture-enps/pulse-not-open", "Pulse is not open");
  }

  const claimed = await tx.pulseParticipation.updateMany({
    where: { id: participation.id, responded: false },
    data: { responded: true },
  });
  if (claimed.count === 0) {
    throw new ApplicationError(
      "culture-enps/already-responded",
      "This pulse was already answered",
    );
  }

  const columns = measurementToColumns(input.response.rating);
  if (
    columns.startValue === null ||
    columns.targetValue === null ||
    columns.currentValue === null
  ) {
    throw new Error("Integer eNPS Measurement must have numeric columns");
  }
  await tx.pulseResponse.create({
    data: {
      organizationId: input.organizationId,
      pulseId: pulse.id,
      teamId: pulse.teamId,
      measurementType: columns.measurementType,
      startValue: columns.startValue,
      targetValue: columns.targetValue,
      currentValue: columns.currentValue,
      checkDone: columns.checkDone,
      textState: columns.textState,
      driver: input.response.driver,
      comment: input.response.comment,
      submittedAt: input.submittedAt,
    },
  });
}
