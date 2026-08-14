import { randomUUID } from "node:crypto";

import type { TenantClient } from "../../../shared/db";

export async function upsertGrowthPlanAggregate(
  tx: TenantClient,
  input: {
    organizationId: string;
    memberId: string;
    nextMilestone: string;
    targets: Array<{ skillId: string; targetLevel: number }>;
  },
): Promise<string> {
  const existing = await tx.growthPlan.findUnique({ where: { memberId: input.memberId } });
  const growthPlanId = existing?.id ?? randomUUID();
  if (existing) {
    await tx.growthPlan.update({
      where: { id: existing.id },
      data: { nextMilestone: input.nextMilestone },
    });
    await tx.growthTarget.deleteMany({ where: { growthPlanId: existing.id } });
  } else {
    await tx.growthPlan.create({
      data: {
        id: growthPlanId,
        organizationId: input.organizationId,
        memberId: input.memberId,
        nextMilestone: input.nextMilestone,
      },
    });
  }
  await tx.growthTarget.createMany({
    data: input.targets.map((target) => ({
      id: randomUUID(),
      organizationId: input.organizationId,
      growthPlanId,
      skillId: target.skillId,
      targetLevel: target.targetLevel,
    })),
  });
  return growthPlanId;
}

export function findGrowthPlanForMember(tx: TenantClient, memberId: string) {
  return tx.growthPlan.findUnique({
    where: { memberId },
    include: {
      targets: { orderBy: { createdAt: "asc" } },
      evidence: { orderBy: { createdAt: "asc" } },
    },
  });
}

export function insertGrowthEvidence(
  tx: TenantClient,
  input: {
    id: string;
    organizationId: string;
    growthPlanId: string;
    source: "Feedback" | "Project";
    feedbackId: string | null;
    projectId: string | null;
  },
): Promise<unknown> {
  return tx.growthEvidence.create({ data: input });
}
