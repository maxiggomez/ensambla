import type { Blocker, BlockerStatus, TenantClient } from "../../../shared/db";

export type BlockerWithObjective = Blocker & {
  objective: { id: string; title: string } | null;
};

export interface InsertBlockerInput {
  id: string;
  organizationId: string;
  teamId: string;
  memberId: string;
  objectiveId: string | null;
  title: string;
  description: string | null;
  status: BlockerStatus;
  createdAt: Date;
}

export async function insertBlocker(
  tx: TenantClient,
  input: InsertBlockerInput,
): Promise<void> {
  await tx.blocker.create({ data: input });
}

export function findBlockerById(tx: TenantClient, id: string): Promise<Blocker | null> {
  return tx.blocker.findUnique({ where: { id } });
}

export function listOpenBlockersWithObjective(
  tx: TenantClient,
): Promise<BlockerWithObjective[]> {
  return tx.blocker.findMany({
    where: { status: "Open" },
    include: { objective: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function countBlockersByStatus(
  tx: TenantClient,
  status: BlockerStatus,
): Promise<number> {
  return tx.blocker.count({ where: { status } });
}

export async function updateBlockerStatus(
  tx: TenantClient,
  id: string,
  status: BlockerStatus,
  resolvedAt?: Date | null,
): Promise<void> {
  await tx.blocker.update({ where: { id }, data: { status, resolvedAt } });
}
