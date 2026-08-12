import type { TenantClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";

export interface StrategyColumns {
  vision: string | null;
  mission: string | null;
  values: string[];
}

export interface StrategyPatch {
  vision?: string | null;
  mission?: string | null;
  values?: string[];
}

/** Actualiza los estatutos de la Organization del tenant actual (campos presentes). */
export async function updateStrategyStatements(
  tx: TenantClient,
  organizationId: string,
  patch: StrategyPatch,
): Promise<void> {
  await tx.organization.update({
    where: { id: organizationId },
    data: patch,
  });
}

export async function findStrategyStatements(
  tx: TenantClient,
  organizationId: string,
): Promise<StrategyColumns> {
  const row = await tx.organization.findUnique({
    where: { id: organizationId },
    select: { vision: true, mission: true, values: true },
  });
  if (!row) {
    throw new ApplicationError(
      "strategy-northstar/organization-not-found",
      "Organization not found",
    );
  }
  return { vision: row.vision, mission: row.mission, values: row.values };
}
