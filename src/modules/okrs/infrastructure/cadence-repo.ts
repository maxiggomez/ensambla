import type { CheckInCadence, TenantClient } from "../../../shared/db";

export type CadenceTarget =
  { objectiveId: string; teamId?: never } | { objectiveId?: never; teamId: string };

export async function upsertCadence(
  tx: TenantClient,
  organizationId: string,
  target: CadenceTarget,
  cadence: CheckInCadence,
): Promise<void> {
  const where = target.objectiveId
    ? { objectiveId: target.objectiveId }
    : { teamId: target.teamId };
  const existing = await tx.okrCadenceConfig.findFirst({ where });
  if (existing) {
    await tx.okrCadenceConfig.update({ where: { id: existing.id }, data: { cadence } });
    return;
  }
  await tx.okrCadenceConfig.create({
    data: {
      organizationId,
      cadence,
      objectiveId: target.objectiveId ?? null,
      teamId: target.teamId ?? null,
    },
  });
}

export function findCadenceObjective(tx: TenantClient, objectiveId: string) {
  return tx.objective.findUnique({ where: { id: objectiveId } });
}

export function listReminderCandidates(tx: TenantClient) {
  return tx.objective.findMany({
    where: { status: "Published" },
    include: {
      cadenceConfigs: true,
      team: { include: { cadenceConfigs: true } },
      keyResults: {
        include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
}
