import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import type { TeamRole } from "../domain/team-role";
import { findTeamById } from "../infrastructure/team-repo";

export interface TeamAssignmentView {
  memberId: string;
  role: TeamRole;
  capacityPercent: number;
}

/** Asignaciones de un Team (lectura para cualquier miembro; usada por skills-matrix). */
export async function listTeamAssignments(
  input: { actorClerkUserId: string; teamId: string },
  client: PrismaClient = prismaClient(),
): Promise<TeamAssignmentView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const team = await findTeamById(tx, input.teamId);
      if (!team) {
        throw new ApplicationError("teams-staffing/team-not-found", "Team not found");
      }
      const assignments = await tx.teamMember.findMany({ where: { teamId: team.id } });
      return assignments.map((assignment) => ({
        memberId: assignment.memberId,
        role: assignment.role,
        capacityPercent: assignment.capacityPercent,
      }));
    },
    client,
  );
}
