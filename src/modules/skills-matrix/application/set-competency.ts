import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { competencyLevel } from "../domain/competency";
import { canManageSkills } from "../domain/skills-policy";
import { findMemberById, upsertCompetency } from "../infrastructure/competency-repo";
import { findSkillById } from "../infrastructure/skill-repo";

export interface SetCompetencyInput {
  actorClerkUserId: string;
  memberId: string;
  skillId: string;
  level: number;
}

/** Registra Member + Skill + Level (0–4); setear de nuevo reemplaza el nivel. */
export async function setCompetency(
  input: SetCompetencyInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const level = competencyLevel(input.level);

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageSkills(actor.role)) {
        throw new ApplicationError(
          "skills-matrix/forbidden",
          "Role not allowed to set competencies",
        );
      }
      const member = await findMemberById(tx, input.memberId);
      if (!member) {
        throw new ApplicationError("skills-matrix/member-not-found", "Member not found");
      }
      const skill = await findSkillById(tx, input.skillId);
      if (!skill) {
        throw new ApplicationError("skills-matrix/skill-not-found", "Skill not found");
      }
      await upsertCompetency(tx, {
        id: randomUUID(),
        organizationId: actor.organizationId,
        memberId: member.id,
        skillId: skill.id,
        level,
      });
    },
    client,
  );
}
