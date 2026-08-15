import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { teamDescription, teamName } from "../domain/team";
import { canManageTeamMembers } from "../domain/team-policy";
import { findAssignment, findTeamById, updateTeamDetails } from "../infrastructure/team-repo";

export interface UpdateTeamInput {
  actorClerkUserId: string;
  teamId: string;
  name: string;
  description?: string | null;
}

export async function updateTeam(
  input: UpdateTeamInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const name = teamName(input.name);
  const description = teamDescription(input.description);
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const team = await findTeamById(tx, input.teamId);
      if (!team) {
        throw new ApplicationError("teams-staffing/team-not-found", "Team not found");
      }
      const assignment = await findAssignment(tx, team.id, actor.id);
      if (!canManageTeamMembers(actor.role, assignment?.role === "Lead")) {
        throw new ApplicationError(
          "teams-staffing/forbidden",
          "Role not allowed to edit this team",
        );
      }
      await updateTeamDetails(tx, team.id, { name, description });
    },
    client,
  );
}
