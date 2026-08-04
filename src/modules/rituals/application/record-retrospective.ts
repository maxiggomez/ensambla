import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import { canManageRituals } from "../domain/policy";
import { insertRetrospective } from "../infrastructure/retro-repo";

export interface RecordRetrospectiveInput {
  actorClerkUserId: string;
  teamId: string;
  heldAt?: Date;
}

export async function recordRetrospective(
  input: RecordRetrospectiveInput,
  client: PrismaClient = prismaClient(),
): Promise<{ retrospectiveId: string }> {
  const heldAt = input.heldAt ?? new Date();

  await listTeamAssignments(
    { actorClerkUserId: input.actorClerkUserId, teamId: input.teamId },
    client,
  );

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageRituals(actor.role)) {
        throw new ApplicationError("rituals/forbidden", "Role not allowed to manage rituals");
      }
      const retrospectiveId = randomUUID();
      await insertRetrospective(tx, {
        id: retrospectiveId,
        organizationId: actor.organizationId,
        teamId: input.teamId,
        heldAt,
      });
      return { retrospectiveId };
    },
    client,
  );
}
