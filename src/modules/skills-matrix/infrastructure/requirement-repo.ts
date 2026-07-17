import type { SkillRequirement, TenantClient } from "../../../shared/db";

export interface InsertRequirementInput {
  id: string;
  organizationId: string;
  skillId: string;
  projectId: string | null;
  keyResultId: string | null;
}

export async function insertRequirement(
  tx: TenantClient,
  input: InsertRequirementInput,
): Promise<void> {
  await tx.skillRequirement.create({ data: input });
}

export function listRequirements(tx: TenantClient): Promise<SkillRequirement[]> {
  return tx.skillRequirement.findMany();
}

export function listRequirementsForNeed(
  tx: TenantClient,
  need: { projectId?: string; keyResultId?: string },
): Promise<SkillRequirement[]> {
  return tx.skillRequirement.findMany({
    where: need.projectId ? { projectId: need.projectId } : { keyResultId: need.keyResultId },
  });
}
