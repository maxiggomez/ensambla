import { randomUUID } from "node:crypto";

import {
  prismaClient,
  tryAcquireOrganizationStructureLock,
  type PrismaClient,
} from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { organizationId } from "../../../shared/ids";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { skillName } from "../domain/skill";
import { canManageSkills } from "../domain/skills-policy";
import { insertSkill } from "../infrastructure/skill-repo";

export interface DefineSkillInput {
  actorClerkUserId: string;
  name: string;
}

export async function defineSkill(
  input: DefineSkillInput,
  client: PrismaClient = prismaClient(),
): Promise<{ skillId: string }> {
  const name = skillName(input.name);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageSkills(actor.role)) {
        throw new ApplicationError(
          "skills-matrix/forbidden",
          "Role not allowed to define skills",
        );
      }
      if (
        !(await tryAcquireOrganizationStructureLock(tx, organizationId(actor.organizationId)))
      ) {
        throw new ApplicationError(
          "skills-matrix/structure-busy",
          "Organization structure is being changed concurrently",
        );
      }
      const skillId = randomUUID();
      await insertSkill(tx, { id: skillId, organizationId: actor.organizationId, name });
      return { skillId };
    },
    client,
  );
}
