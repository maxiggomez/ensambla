import { randomUUID } from "node:crypto";

import type { TenantClient } from "../../../shared/db";
import type { OrganizationId } from "../../../shared/ids";
import { skillName } from "../domain/skill";
import { countSkills, insertSkill } from "../infrastructure/skill-repo";

export async function isTemplateSkillTargetEmpty(tx: TenantClient): Promise<boolean> {
  return (await countSkills(tx)) === 0;
}

export async function materializeTemplateSkills(
  tx: TenantClient,
  organizationId: OrganizationId,
  names: readonly string[],
): Promise<void> {
  const validatedNames = names.map(skillName);
  for (const name of validatedNames) {
    await insertSkill(tx, { id: randomUUID(), organizationId, name });
  }
}
