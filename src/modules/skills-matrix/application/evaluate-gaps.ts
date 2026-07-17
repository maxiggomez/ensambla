import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listObjectives } from "../../okrs/application";
import {
  COVERAGE_LEVEL,
  evaluateGaps as gapsFromDemands,
  type SkillGaps,
} from "../domain/gaps";
import { listCompetencies } from "../infrastructure/competency-repo";
import { listRequirements } from "../infrastructure/requirement-repo";

export interface EvaluateGapsInput {
  actorClerkUserId: string;
}

/**
 * Gaps de cobertura y bus factor sobre las skills requeridas por KeyResults de
 * Objectives publicados (vía la interfaz pública de okrs).
 */
export async function evaluateGaps(
  input: EvaluateGapsInput,
  client: PrismaClient = prismaClient(),
): Promise<SkillGaps> {
  const objectives = await listObjectives({ actorClerkUserId: input.actorClerkUserId }, client);
  const objectiveByKeyResult = new Map<string, string>();
  for (const objective of objectives) {
    if (objective.status !== "Published") {
      continue;
    }
    for (const keyResult of objective.keyResults) {
      objectiveByKeyResult.set(keyResult.id, objective.id);
    }
  }

  const { requirements, competencies } = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return {
        requirements: await listRequirements(tx),
        competencies: await listCompetencies(tx),
      };
    },
    client,
  );

  const objectivesBySkill = new Map<string, Set<string>>();
  for (const requirement of requirements) {
    if (!requirement.keyResultId) {
      continue;
    }
    const objectiveId = objectiveByKeyResult.get(requirement.keyResultId);
    if (!objectiveId) {
      continue;
    }
    const set = objectivesBySkill.get(requirement.skillId) ?? new Set<string>();
    set.add(objectiveId);
    objectivesBySkill.set(requirement.skillId, set);
  }

  const coverageBySkill = new Map<string, number>();
  for (const competency of competencies) {
    if (competency.level >= COVERAGE_LEVEL) {
      coverageBySkill.set(
        competency.skillId,
        (coverageBySkill.get(competency.skillId) ?? 0) + 1,
      );
    }
  }

  return gapsFromDemands(
    [...objectivesBySkill.entries()].map(([skillId, objectiveIds]) => ({
      skillId,
      requiringObjectiveIds: [...objectiveIds],
      coverageCount: coverageBySkill.get(skillId) ?? 0,
    })),
  );
}
