import type { NorthStarLever, TenantClient } from "../../../shared/db";

export interface InsertLeverInput {
  id: string;
  organizationId: string;
  northStarId: string;
  name: string;
  objectiveId: string | null;
}

export async function insertLever(tx: TenantClient, input: InsertLeverInput): Promise<void> {
  await tx.northStarLever.create({ data: input });
}

export function listLevers(
  tx: TenantClient,
  organizationId: string,
): Promise<NorthStarLever[]> {
  return tx.northStarLever.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}
