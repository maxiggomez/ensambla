import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getCompetencyMatrix } from "../../skills-matrix/application";
import { parseGrowthPlan, type GrowthTargetInput } from "../domain/growth-plan";
import { upsertGrowthPlanAggregate } from "../infrastructure/growth-plan-repo";

export interface DefineGrowthPlanInput {
  actorClerkUserId: string;
  nextMilestone: string;
  targets: GrowthTargetInput[];
}

export async function defineGrowthPlan(
  input: DefineGrowthPlanInput,
  client: PrismaClient = prismaClient(),
): Promise<{ growthPlanId: string }> {
  const plan = parseGrowthPlan(input);
  const matrix = await getCompetencyMatrix(
    { actorClerkUserId: input.actorClerkUserId },
    client,
  );
  const skillIds = new Set(matrix.skills.map((skill) => skill.skillId));
  if (plan.targets.some((target) => !skillIds.has(target.skillId))) {
    throw new ApplicationError("feedback-growth/skill-not-found", "Skill not found");
  }
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const growthPlanId = await upsertGrowthPlanAggregate(tx, {
        organizationId: actor.organizationId,
        memberId: actor.id,
        nextMilestone: plan.nextMilestone,
        targets: plan.targets,
      });
      return { growthPlanId };
    },
    client,
  );
}
