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

export async function updateSkillName(
  tx: TenantClient,
  id: string,
  name: string,
): Promise<void> {
  await tx.skill.update({ where: { id }, data: { name } });
}

export function listSkills(tx: TenantClient): Promise<Skill[]> {
  return tx.skill.findMany({ orderBy: { name: "asc" } });
}

export function countSkills(tx: TenantClient): Promise<number> {
  return tx.skill.count();
}
