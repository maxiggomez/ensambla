import type { KeyResult, Member, Objective, TenantClient } from "../../../shared/db";
import type { ObjectiveLevel, ObjectiveStatus } from "../domain/objective";

export type ObjectiveWithKeyResults = Objective & { keyResults: KeyResult[] };

export interface InsertObjectiveInput {
  id: string;
  organizationId: string;
  title: string;
  level: ObjectiveLevel;
  ownerId: string;
}

export async function insertObjective(
  tx: TenantClient,
  input: InsertObjectiveInput,
): Promise<void> {
  await tx.objective.create({ data: input });
}

export function findObjectiveWithKeyResults(
  tx: TenantClient,
  id: string,
): Promise<ObjectiveWithKeyResults | null> {
  return tx.objective.findUnique({ where: { id }, include: { keyResults: true } });
}

export function listObjectivesWithKeyResults(
  tx: TenantClient,
): Promise<ObjectiveWithKeyResults[]> {
  return tx.objective.findMany({
    include: { keyResults: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateObjectiveStatus(
  tx: TenantClient,
  id: string,
  status: ObjectiveStatus,
): Promise<void> {
  await tx.objective.update({ where: { id }, data: { status } });
}

/** Lookup RLS-scoped del owner: garantiza que el Member es del mismo tenant. */
export function findOwnerMember(tx: TenantClient, memberId: string): Promise<Member | null> {
  return tx.member.findUnique({ where: { id: memberId } });
}
