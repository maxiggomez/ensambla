import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { capacityPercent } from "../domain/capacity";
import { canManageTeamMembers } from "../domain/team-policy";
import type { TeamRole } from "../domain/team-role";
import {
  findAssignment,
  findMemberById,
  findTeamById,
  upsertAssignment,
} from "../infrastructure/team-repo";

export interface AssignTeamMemberInput {
  actorClerkUserId: string;
  teamId: string;
  memberId: string;
  role: TeamRole;
  capacityPercent: number;
}

/**
 * Asigna (o re-asigna: única por team+member) un Member a un Team con rol y
 * % de capacity. Dirección siempre; Líder solo si es Lead de ese Team.
 */
export async function assignTeamMember(
  input: AssignTeamMemberInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const percent = capacityPercent(input.capacityPercent);

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const team = await findTeamById(tx, input.teamId);
      if (!team) {
        throw new ApplicationError("teams-staffing/team-not-found", "Team not found");
      }
      const actorAssignment = await findAssignment(tx, team.id, actor.id);
      if (!canManageTeamMembers(actor.role, actorAssignment?.role === "Lead")) {
        throw new ApplicationError(
          "teams-staffing/forbidden",
          "Role not allowed to manage this team's members",
        );
      }
      // Lookup RLS-scoped: un memberId de otro tenant no existe acá.
      const member = await findMemberById(tx, input.memberId);
      if (!member) {
        throw new ApplicationError("teams-staffing/member-not-found", "Member not found");
      }

      await upsertAssignment(tx, {
        id: randomUUID(),
        organizationId: actor.organizationId,
        teamId: team.id,
        memberId: member.id,
        role: input.role,
        capacityPercent: percent,
      });
    },
    client,
  );
}
