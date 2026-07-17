import type { Team, TeamMember, TenantClient } from "../../../shared/db";
import type { TeamRole } from "../domain/team-role";

export type TeamWithMembers = Team & { members: TeamMember[] };

export interface InsertTeamInput {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
}

export async function insertTeam(tx: TenantClient, input: InsertTeamInput): Promise<void> {
  await tx.team.create({ data: input });
}

export function findTeamById(tx: TenantClient, id: string): Promise<Team | null> {
  return tx.team.findUnique({ where: { id } });
}

export function listTeamsWithMembers(tx: TenantClient): Promise<TeamWithMembers[]> {
  return tx.team.findMany({ include: { members: true }, orderBy: { createdAt: "asc" } });
}

export function listAllAssignments(tx: TenantClient): Promise<TeamMember[]> {
  return tx.teamMember.findMany();
}

export function findAssignment(
  tx: TenantClient,
  teamId: string,
  memberId: string,
): Promise<TeamMember | null> {
  return tx.teamMember.findUnique({ where: { teamId_memberId: { teamId, memberId } } });
}

export interface UpsertAssignmentInput {
  id: string;
  organizationId: string;
  teamId: string;
  memberId: string;
  role: TeamRole;
  capacityPercent: number;
}

/** Única por (team, member): re-asignar actualiza rol y capacity. */
export async function upsertAssignment(
  tx: TenantClient,
  input: UpsertAssignmentInput,
): Promise<void> {
  await tx.teamMember.upsert({
    where: { teamId_memberId: { teamId: input.teamId, memberId: input.memberId } },
    create: input,
    update: { role: input.role, capacityPercent: input.capacityPercent },
  });
}

export function findMemberById(tx: TenantClient, memberId: string) {
  return tx.member.findUnique({ where: { id: memberId } });
}
