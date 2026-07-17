import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { canViewObjective } from "../domain/objective-policy";
import { findObjectiveWithKeyResults } from "../infrastructure/objective-repo";

import { toObjectiveView, type ObjectiveView } from "./objective-view";

export interface GetObjectiveInput {
  actorClerkUserId: string;
  objectiveId: string;
}

/** Devuelve el Objective con su progreso derivado (roll-up 🔒). */
export async function getObjective(
  input: GetObjectiveInput,
  client: PrismaClient = prismaClient(),
): Promise<ObjectiveView> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const objective = await findObjectiveWithKeyResults(tx, input.objectiveId);
      if (
        !objective ||
        !canViewObjective(actor.role, objective.ownerId === actor.id, objective.status)
      ) {
        throw new ApplicationError("okrs/objective-not-found", "Objective not found");
      }
      return toObjectiveView(objective);
    },
    client,
  );
}
