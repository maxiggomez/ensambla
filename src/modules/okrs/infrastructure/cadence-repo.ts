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

export interface ReminderCandidate {
  id: string;
  title: string;
  publishedAt: Date | null;
  createdAt: Date;
  cadenceConfigs: Array<{ cadence: CheckInCadence }>;
  team: { cadenceConfigs: Array<{ cadence: CheckInCadence }> } | null;
  keyResults: Array<{
    id: string;
    title: string;
    checkIns: Array<{ createdAt: Date }>;
  }>;
}

export async function listReminderCandidates(tx: TenantClient): Promise<ReminderCandidate[]> {
  const objectives = await tx.objective.findMany({
    where: { status: "Published" },
    select: {
      id: true,
      title: true,
      teamId: true,
      publishedAt: true,
      createdAt: true,
    },
  });
  if (objectives.length === 0) return [];

  const objectiveIds = objectives.map((objective) => objective.id);
  const teamIds = objectives.flatMap((objective) =>
    objective.teamId === null ? [] : [objective.teamId],
  );
  const cadences = await tx.okrCadenceConfig.findMany({
    where: {
      OR: [{ objectiveId: { in: objectiveIds } }, { teamId: { in: teamIds } }],
    },
    select: { objectiveId: true, teamId: true, cadence: true },
  });
  const keyResults = await tx.keyResult.findMany({
    where: { objectiveId: { in: objectiveIds } },
    select: { id: true, objectiveId: true, title: true },
  });
  const latestCheckIns = await tx.checkIn.groupBy({
    by: ["keyResultId"],
    where: { keyResultId: { in: keyResults.map((keyResult) => keyResult.id) } },
    _max: { createdAt: true },
  });

  const objectiveCadence = new Map(
    cadences.flatMap((cadence) =>
      cadence.objectiveId === null
        ? []
        : [[cadence.objectiveId, { cadence: cadence.cadence }] as const],
    ),
  );
  const teamCadence = new Map(
    cadences.flatMap((cadence) =>
      cadence.teamId === null ? [] : [[cadence.teamId, { cadence: cadence.cadence }] as const],
    ),
  );
  const latestCheckIn = new Map<string, { createdAt: Date }>();
  for (const checkIn of latestCheckIns) {
    if (checkIn._max.createdAt !== null) {
      latestCheckIn.set(checkIn.keyResultId, { createdAt: checkIn._max.createdAt });
    }
  }
  const keyResultsByObjective = new Map<string, ReminderCandidate["keyResults"]>();
  for (const keyResult of keyResults) {
    const list = keyResultsByObjective.get(keyResult.objectiveId) ?? [];
    const checkIn = latestCheckIn.get(keyResult.id);
    list.push({
      id: keyResult.id,
      title: keyResult.title,
      checkIns: checkIn ? [checkIn] : [],
    });
    keyResultsByObjective.set(keyResult.objectiveId, list);
  }

  return objectives.map((objective) => {
    const ownCadence = objectiveCadence.get(objective.id);
    const inheritedCadence =
      objective.teamId === null ? undefined : teamCadence.get(objective.teamId);
    return {
      id: objective.id,
      title: objective.title,
      publishedAt: objective.publishedAt,
      createdAt: objective.createdAt,
      cadenceConfigs: ownCadence ? [ownCadence] : [],
      team:
        objective.teamId === null
          ? null
          : { cadenceConfigs: inheritedCadence ? [inheritedCadence] : [] },
      keyResults: keyResultsByObjective.get(objective.id) ?? [],
    };
  });
}
