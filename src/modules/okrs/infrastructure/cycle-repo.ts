import type { KeyResultGrade, TenantClient } from "../../../shared/db";

export async function insertCycle(
  tx: TenantClient,
  input: {
    id: string;
    organizationId: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
  },
): Promise<void> {
  await tx.okrCycle.create({ data: input });
}

export async function updateKeyResultGrade(
  tx: TenantClient,
  keyResultId: string,
  grade: KeyResultGrade,
): Promise<void> {
  await tx.keyResult.update({ where: { id: keyResultId }, data: { grade } });
}

export function findCycleKeyResult(tx: TenantClient, keyResultId: string) {
  return tx.keyResult.findUnique({
    where: { id: keyResultId },
    include: { objective: true },
  });
}

export function findCarryOverObjective(
  tx: TenantClient,
  sourceObjectiveId: string,
  cycleId: string,
) {
  return tx.objective.findFirst({ where: { sourceObjectiveId, cycleId } });
}

export async function insertCarryOverObjective(
  tx: TenantClient,
  input: {
    id: string;
    organizationId: string;
    title: string;
    level: "Company" | "Area" | "Team" | "Person";
    ownerId: string;
    teamId: string | null;
    parentObjectiveId: string | null;
    cycleId: string;
    sourceObjectiveId: string;
  },
): Promise<void> {
  await tx.objective.create({ data: input });
}
