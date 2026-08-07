import type { Retrospective, TenantClient } from "../../../shared/db";

export interface InsertRetrospectiveInput {
  id: string;
  organizationId: string;
  teamId: string;
  heldAt: Date;
}

export async function insertRetrospective(
  tx: TenantClient,
  input: InsertRetrospectiveInput,
): Promise<void> {
  await tx.retrospective.create({ data: input });
}

export function listRetrosForTeams(
  tx: TenantClient,
  teamIds: readonly string[],
): Promise<Retrospective[]> {
  return tx.retrospective.findMany({ where: { teamId: { in: [...teamIds] } } });
}
