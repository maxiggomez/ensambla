import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { skillName } from "../domain/skill";
import { canManageSkills } from "../domain/skills-policy";
import { findSkillById, updateSkillName } from "../infrastructure/skill-repo";

export interface RenameSkillInput {
  actorClerkUserId: string;
  skillId: string;
  name: string;
}

export async function renameSkill(
  input: RenameSkillInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const name = skillName(input.name);
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageSkills(actor.role)) {
        throw new ApplicationError(
          "skills-matrix/forbidden",
          "Role not allowed to rename skills",
        );
      }
      const skill = await findSkillById(tx, input.skillId);
      if (!skill) {
        throw new ApplicationError("skills-matrix/skill-not-found", "Skill not found");
      }
      await updateSkillName(tx, skill.id, name);
    },
    client,
  );
}
