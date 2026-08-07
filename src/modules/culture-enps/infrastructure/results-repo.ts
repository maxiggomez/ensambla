import type { TenantClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { measurementFromColumns, type Measurement } from "../../../shared/measurement";
import type { Driver } from "../domain/driver";
import type { PulseScope } from "../domain/pulse";

type IntegerMeasurement = Extract<Measurement, { type: "integer" }>;

export interface AggregateInputs {
  pulseId: string;
  scope: PulseScope;
  minimumResponses: number;
  recipientCount: number;
  responses: Array<{
    rating: IntegerMeasurement;
    driver: Driver;
    comment: string | null;
  }>;
}

export async function getAggregateInputs(
  tx: TenantClient,
  pulseId: string,
): Promise<AggregateInputs> {
  const pulse = await tx.pulse.findUnique({ where: { id: pulseId } });
  if (!pulse) {
    throw new ApplicationError("culture-enps/pulse-not-found", "Pulse not found");
  }
  const [organization, recipientCount, rows] = await Promise.all([
    tx.organization.findUniqueOrThrow({ where: { id: pulse.organizationId } }),
    tx.pulseParticipation.count({ where: { pulseId } }),
    tx.pulseResponse.findMany({
      where: { pulseId },
      select: {
        measurementType: true,
        startValue: true,
        targetValue: true,
        currentValue: true,
        checkDone: true,
        textState: true,
        driver: true,
        comment: true,
      },
      orderBy: { submittedAt: "asc" },
    }),
  ]);
  const responses = rows.map((row) => {
    const rating = measurementFromColumns({
      measurementType: row.measurementType,
      startValue: row.startValue === null ? null : Number(row.startValue),
      targetValue: row.targetValue === null ? null : Number(row.targetValue),
      currentValue: row.currentValue === null ? null : Number(row.currentValue),
      checkDone: row.checkDone,
      textState: row.textState,
    });
    if (rating.type !== "integer") {
      throw new Error("Stored eNPS rating must be an Integer Measurement");
    }
    return { rating, driver: row.driver as Driver, comment: row.comment };
  });
  return {
    pulseId,
    scope:
      pulse.scope === "Organization"
        ? { type: "organization" }
        : { type: "team", teamId: pulse.teamId! },
    minimumResponses: organization.enpsMinimumResponses,
    recipientCount,
    responses,
  };
}

export async function updateMinimumResponses(
  tx: TenantClient,
  organizationId: string,
  minimumResponses: number,
): Promise<void> {
  await tx.organization.update({
    where: { id: organizationId },
    data: { enpsMinimumResponses: minimumResponses },
  });
}

export async function getMinimumResponses(
  tx: TenantClient,
  organizationId: string,
): Promise<number> {
  const organization = await tx.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { enpsMinimumResponses: true },
  });
  return organization.enpsMinimumResponses;
}
