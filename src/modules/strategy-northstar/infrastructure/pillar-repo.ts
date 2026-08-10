import { randomUUID } from "node:crypto";

import type { PillarObjective, StrategicPillar, TenantClient } from "../../../shared/db";

export interface InsertPillarInput {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
}

export async function insertPillar(tx: TenantClient, input: InsertPillarInput): Promise<void> {
  await tx.strategicPillar.create({ data: input });
}

export function findPillar(tx: TenantClient, id: string): Promise<StrategicPillar | null> {
  return tx.strategicPillar.findUnique({ where: { id } });
}

export function findPillarObjective(
  tx: TenantClient,
  pillarId: string,
  objectiveId: string,
): Promise<PillarObjective | null> {
  return tx.pillarObjective.findUnique({
    where: { pillarId_objectiveId: { pillarId, objectiveId } },
  });
}

export async function insertPillarObjective(
  tx: TenantClient,
  input: {
    organizationId: string;
    pillarId: string;
    objectiveId: string;
  },
): Promise<void> {
  await tx.pillarObjective.create({
    data: { id: randomUUID(), ...input },
  });
}

export function listPillarsWithLinks(
  tx: TenantClient,
  organizationId: string,
): Promise<(StrategicPillar & { objectiveLinks: PillarObjective[] })[]> {
  return tx.strategicPillar.findMany({
    where: { organizationId },
    include: { objectiveLinks: true },
    orderBy: { createdAt: "asc" },
  });
}
