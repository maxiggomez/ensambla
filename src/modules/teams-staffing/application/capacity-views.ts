import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { isOverloaded, personLoad, teamCapacity } from "../domain/capacity";
import { listAllAssignments, listTeamsWithMembers } from "../infrastructure/team-repo";

export interface TeamCapacityView {
  teamId: string;
  name: string;
  /** Derivada: suma de las asignaciones. Nunca persistida. */
  capacity: number;
  overloaded: boolean;
}

export interface MemberLoadView {
  memberId: string;
  /** Derivada: suma de sus asignaciones entre Teams. Nunca persistida. */
  load: number;
  overloaded: boolean;
}

export async function listTeamCapacities(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<TeamCapacityView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const teams = await listTeamsWithMembers(tx);
      return teams.map((team) => {
        const capacity = teamCapacity(team.members);
        return {
          teamId: team.id,
          name: team.name,
          capacity,
          overloaded: isOverloaded(capacity),
        };
      });
    },
    client,
  );
}

export async function listMemberLoads(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<MemberLoadView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const assignments = await listAllAssignments(tx);
      const byMember = new Map<string, { capacityPercent: number }[]>();
      for (const assignment of assignments) {
        const list = byMember.get(assignment.memberId) ?? [];
        list.push(assignment);
        byMember.set(assignment.memberId, list);
      }
      return [...byMember.entries()].map(([memberId, memberAssignments]) => {
        const load = personLoad(memberAssignments);
        return { memberId, load, overloaded: isOverloaded(load) };
      });
    },
    client,
  );
}
