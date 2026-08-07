import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getObjective } from "../../okrs/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import { blockerDescription, blockerTitle, openBlockerStatus } from "../domain/blocker";
import { canManageRituals } from "../domain/policy";
import { insertBlocker } from "../infrastructure/blocker-repo";

export interface RecordBlockerInput {
  actorClerkUserId: string;
  teamId: string;
  title: string;
  description?: string | null;
  objectiveId?: string | null;
}

export async function recordBlocker(
  input: RecordBlockerInput,
  client: PrismaClient = prismaClient(),
): Promise<{ blockerId: string }> {
  const title = blockerTitle(input.title);
  const description = blockerDescription(input.description);

  // Pertenencia del Team y del Objective (si existe) al tenant, validada vía
  // las interfaces públicas de teams-staffing y okrs.
  await listTeamAssignments(
    { actorClerkUserId: input.actorClerkUserId, teamId: input.teamId },
    client,
  );
  if (input.objectiveId) {
    await getObjective(
      { actorClerkUserId: input.actorClerkUserId, objectiveId: input.objectiveId },
      client,
    );
  }

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageRituals(actor.role)) {
        throw new ApplicationError("rituals/forbidden", "Role not allowed to manage rituals");
      }
      const blockerId = randomUUID();
      await insertBlocker(tx, {
        id: blockerId,
        organizationId: actor.organizationId,
        teamId: input.teamId,
        memberId: actor.id,
        objectiveId: input.objectiveId ?? null,
        title,
        description,
        status: openBlockerStatus(),
        createdAt: new Date(),
      });
      return { blockerId };
    },
    client,
  );
}
