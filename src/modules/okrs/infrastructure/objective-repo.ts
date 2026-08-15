import type {
  KeyResult,
  Member,
  Objective,
  PillarObjective,
  TenantClient,
} from "../../../shared/db";
import type { ObjectiveLevel, ObjectiveStatus } from "../domain/objective";

export type ObjectiveWithKeyResults = Objective & {
  keyResults: KeyResult[];
  pillarLinks: PillarObjective[];
};

export interface InsertObjectiveInput {
  id: string;
  organizationId: string;
  title: string;
  level: ObjectiveLevel;
  ownerId: string;
  teamId?: string | null;
  parentObjectiveId?: string | null;
  cycleId?: string | null;
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
  return tx.objective.findUnique({
    where: { id },
    include: { keyResults: true, pillarLinks: true },
  });
}

export function listObjectivesWithKeyResults(
  tx: TenantClient,
): Promise<ObjectiveWithKeyResults[]> {
  return tx.objective.findMany({
    include: { keyResults: true, pillarLinks: true },
    orderBy: { createdAt: "asc" },
  });
}

export function countObjectives(tx: TenantClient): Promise<number> {
  return tx.objective.count();
}

export async function updateObjectiveStatus(
  tx: TenantClient,
  id: string,
  status: ObjectiveStatus,
): Promise<void> {
  await tx.objective.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "Published" ? new Date() : undefined,
      closedAt: status === "Closed" ? new Date() : undefined,
      archivedAt: status === "Archived" ? new Date() : undefined,
    },
  });
}

export async function updateObjectiveTitle(
  tx: TenantClient,
  id: string,
  title: string,
): Promise<void> {
  await tx.objective.update({ where: { id }, data: { title } });
}

/** Lookup RLS-scoped del owner: garantiza que el Member es del mismo tenant. */
export function findOwnerMember(tx: TenantClient, memberId: string): Promise<Member | null> {
  return tx.member.findUnique({ where: { id: memberId } });
}

export function findCycle(tx: TenantClient, cycleId: string) {
  return tx.okrCycle.findUnique({ where: { id: cycleId } });
}
