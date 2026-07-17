import { randomUUID } from "node:crypto";

import type { NorthStar, TenantClient } from "../../../shared/db";
import type { MeasurementColumns } from "../../../shared/measurement";

export interface UpsertNorthStarInput {
  organizationId: string;
  name: string;
  columns: MeasurementColumns;
}

/** Upsert sobre UNIQUE(organization_id): exactamente una North Star por tenant. */
export async function upsertNorthStar(
  tx: TenantClient,
  input: UpsertNorthStarInput,
): Promise<void> {
  const values = {
    name: input.name,
    measurementType: input.columns.measurementType,
    startValue: input.columns.startValue,
    targetValue: input.columns.targetValue,
    currentValue: input.columns.currentValue,
    checkDone: input.columns.checkDone,
    textState: input.columns.textState,
  };
  await tx.northStar.upsert({
    where: { organizationId: input.organizationId },
    create: { id: randomUUID(), organizationId: input.organizationId, ...values },
    update: values,
  });
}

export function findNorthStar(
  tx: TenantClient,
  organizationId: string,
): Promise<NorthStar | null> {
  return tx.northStar.findUnique({ where: { organizationId } });
}
