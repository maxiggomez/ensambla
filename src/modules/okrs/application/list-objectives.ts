import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { canViewObjective } from "../domain/objective-policy";
import { listObjectivesWithKeyResults } from "../infrastructure/objective-repo";

import { toObjectiveView, type ObjectiveView } from "./objective-view";

export interface ListObjectivesInput {
  actorClerkUserId: string;
}

/** Lista los Objectives visibles para el actor, con progreso derivado (roll-up 🔒). */
export async function listObjectives(
  input: ListObjectivesInput,
  client: PrismaClient = prismaClient(),
): Promise<ObjectiveView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const objectives = await listObjectivesWithKeyResults(tx);
      return objectives
        .filter((objective) =>
          canViewObjective(actor.role, objective.ownerId === actor.id, objective.status),
        )
        .map(toObjectiveView);
    },
    client,
  );
}
