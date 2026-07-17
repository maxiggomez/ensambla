import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { listMembers, requireActor, seniorityRank } from "../../identity-org/application";
import { listMemberLoads } from "../../teams-staffing/application";
import { suggestCandidates, type StaffingSuggestion } from "../domain/matching";
import { listCompetencies } from "../infrastructure/competency-repo";
import { listRequirementsForNeed } from "../infrastructure/requirement-repo";

export interface SuggestStaffingInput {
  actorClerkUserId: string;
  /** Exactamente uno: la necesidad es un Project o un KeyResult con skills requeridas. */
  projectId?: string;
  keyResultId?: string;
}

/**
 * Sugerencias de personas para una necesidad, ordenadas por nivel → seniority
 * → disponibilidad; "no margin" con carga ≥ 100 (se sugiere igual).
 */
export async function suggestStaffing(
  input: SuggestStaffingInput,
  client: PrismaClient = prismaClient(),
): Promise<StaffingSuggestion[]> {
  if (Boolean(input.projectId) === Boolean(input.keyResultId)) {
    throw new ApplicationError(
      "skills-matrix/invalid-requirement",
      "A staffing need is exactly one Project or one KeyResult",
    );
  }

  const { requiredSkillIds, competencies } = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const requirements = await listRequirementsForNeed(tx, {
        projectId: input.projectId,
        keyResultId: input.keyResultId,
      });
      return {
        requiredSkillIds: requirements.map((requirement) => requirement.skillId),
        competencies: await listCompetencies(tx),
      };
    },
    client,
  );
  if (requiredSkillIds.length === 0) {
    return [];
  }

  const members = await listMembers({ actorClerkUserId: input.actorClerkUserId }, client);
  const loads = new Map(
    (await listMemberLoads({ actorClerkUserId: input.actorClerkUserId }, client)).map(
      (view) => [view.memberId, view.load],
    ),
  );
  const levelByMemberSkill = new Map(
    competencies.map((competency) => [
      `${competency.memberId}:${competency.skillId}`,
      competency.level,
    ]),
  );

  return suggestCandidates(
    members.map((member) => ({
      memberId: member.id,
      name: member.name,
      seniorityRank: seniorityRank(member.seniority),
      load: loads.get(member.id) ?? 0,
      skillLevels: requiredSkillIds.map(
        (skillId) => levelByMemberSkill.get(`${member.id}:${skillId}`) ?? 0,
      ),
    })),
  );
}
