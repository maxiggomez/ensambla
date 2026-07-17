import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { teamDescription, teamName } from "../domain/team";
import { canCreateTeam } from "../domain/team-policy";
import { insertTeam } from "../infrastructure/team-repo";

export interface CreateTeamInput {
  actorClerkUserId: string;
  name: string;
  description?: string | null;
}

export async function createTeam(
  input: CreateTeamInput,
  client: PrismaClient = prismaClient(),
): Promise<{ teamId: string }> {
  const name = teamName(input.name);
  const description = teamDescription(input.description);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canCreateTeam(actor.role)) {
        throw new ApplicationError(
          "teams-staffing/forbidden",
          "Role not allowed to create teams",
        );
      }
      const teamId = randomUUID();
      await insertTeam(tx, {
        id: teamId,
        organizationId: actor.organizationId,
        name,
        description,
      });
      return { teamId };
    },
    client,
  );
}
