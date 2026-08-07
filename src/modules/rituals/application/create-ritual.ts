import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import { ritualCadence, ritualName } from "../domain/cadence";
import { canManageRituals } from "../domain/policy";
import { insertRitual } from "../infrastructure/ritual-repo";

export interface CreateRitualInput {
  actorClerkUserId: string;
  teamId: string;
  name: string;
  cadence: string;
  startDate: Date;
}

export async function createRitual(
  input: CreateRitualInput,
  client: PrismaClient = prismaClient(),
): Promise<{ ritualId: string }> {
  const name = ritualName(input.name);
  const cadence = ritualCadence(input.cadence);

  // Pertenencia del Team al tenant, validada vía la interfaz pública de
  // teams-staffing (lanza `team-not-found` si el Team es de otro tenant).
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
      const ritualId = randomUUID();
      await insertRitual(tx, {
        id: ritualId,
        organizationId: actor.organizationId,
        teamId: input.teamId,
        name,
        cadence,
        startDate: input.startDate,
      });
      return { ritualId };
    },
    client,
  );
}
