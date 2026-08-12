import type { TenantClient } from "../../../shared/db";

export function findAlignmentKeyResult(tx: TenantClient, keyResultId: string) {
  return tx.keyResult.findUnique({
    where: { id: keyResultId },
    include: { objective: true },
  });
}

export async function readObjectiveChain(
  tx: TenantClient,
  startingObjectiveId: string,
): Promise<{ id: string; title: string; parentObjectiveId: string | null }[]> {
  const chain: { id: string; title: string; parentObjectiveId: string | null }[] = [];
  const visited = new Set<string>();
  let currentId: string | null = startingObjectiveId;
  while (currentId !== null) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const objective: {
      id: string;
      title: string;
      parentObjectiveId: string | null;
    } | null = await tx.objective.findUnique({
      where: { id: currentId },
      select: { id: true, title: true, parentObjectiveId: true },
    });
    if (!objective) break;
    chain.push(objective);
    currentId = objective.parentObjectiveId;
  }
  return chain;
}

export async function updateObjectiveParent(
  tx: TenantClient,
  objectiveId: string,
  parentObjectiveId: string,
): Promise<void> {
  await tx.objective.update({ where: { id: objectiveId }, data: { parentObjectiveId } });
}
