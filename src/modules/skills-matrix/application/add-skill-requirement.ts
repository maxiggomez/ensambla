import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { canManageSkills } from "../domain/skills-policy";
import { insertRequirement } from "../infrastructure/requirement-repo";
import { findSkillById } from "../infrastructure/skill-repo";

export interface AddSkillRequirementInput {
  actorClerkUserId: string;
  skillId: string;
  /** Exactamente uno de los dos: la necesidad vive en un Project o un KeyResult. */
  projectId?: string;
  keyResultId?: string;
}

export async function addSkillRequirement(
  input: AddSkillRequirementInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  if (Boolean(input.projectId) === Boolean(input.keyResultId)) {
    throw new ApplicationError(
      "skills-matrix/invalid-requirement",
      "A skill requirement targets exactly one Project or one KeyResult",
    );
  }

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageSkills(actor.role)) {
        throw new ApplicationError(
          "skills-matrix/forbidden",
          "Role not allowed to manage skill requirements",
        );
      }
      const skill = await findSkillById(tx, input.skillId);
      if (!skill) {
        throw new ApplicationError("skills-matrix/skill-not-found", "Skill not found");
      }
      // El destino (Project/KeyResult) lo garantiza la FK dentro del tenant.
      await insertRequirement(tx, {
        id: randomUUID(),
        organizationId: actor.organizationId,
        skillId: skill.id,
        projectId: input.projectId ?? null,
        keyResultId: input.keyResultId ?? null,
      });
    },
    client,
  );
}
