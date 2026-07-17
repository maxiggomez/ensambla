import type { Competency, Member, TenantClient } from "../../../shared/db";

export interface UpsertCompetencyInput {
  id: string;
  organizationId: string;
  memberId: string;
  skillId: string;
  level: number;
}

/** Única por (member, skill): setear de nuevo reemplaza el nivel. */
export async function upsertCompetency(
  tx: TenantClient,
  input: UpsertCompetencyInput,
): Promise<void> {
  await tx.competency.upsert({
    where: { memberId_skillId: { memberId: input.memberId, skillId: input.skillId } },
    create: input,
    update: { level: input.level },
  });
}

export function listCompetencies(tx: TenantClient): Promise<Competency[]> {
  return tx.competency.findMany();
}

export function findMemberById(tx: TenantClient, memberId: string): Promise<Member | null> {
  return tx.member.findUnique({ where: { id: memberId } });
}
