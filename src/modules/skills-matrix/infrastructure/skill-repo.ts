import type { Skill, TenantClient } from "../../../shared/db";

export interface InsertSkillInput {
  id: string;
  organizationId: string;
  name: string;
}

export async function insertSkill(tx: TenantClient, input: InsertSkillInput): Promise<void> {
  await tx.skill.create({ data: input });
}

export function findSkillById(tx: TenantClient, id: string): Promise<Skill | null> {
  return tx.skill.findUnique({ where: { id } });
}

export function listSkills(tx: TenantClient): Promise<Skill[]> {
  return tx.skill.findMany({ orderBy: { name: "asc" } });
}
