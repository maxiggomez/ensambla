import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { getObjective } from "../../okrs/application";
import { inputLever } from "../domain/input-lever";
import { findNorthStar } from "../infrastructure/north-star-repo";
import { insertLever } from "../infrastructure/lever-repo";

export interface AddInputLeverInput {
  actorClerkUserId: string;
  name: string;
  objectiveId?: string | null;
}

/** Agrega un input lever bajo la North Star (solo Dirección). Si trae
 * `objectiveId`, valida que el Objective exista y sea del tenant (vía okrs). */
export async function addInputLever(
  input: AddInputLeverInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const lever = inputLever({ name: input.name, objectiveId: input.objectiveId });

  if (lever.objectiveId !== null) {
    try {
      await getObjective(
        { actorClerkUserId: input.actorClerkUserId, objectiveId: lever.objectiveId },
        client,
      );
    } catch {
      throw new ApplicationError(
        "strategy-northstar/objective-not-found",
        "Objective not found in this organization",
      );
    }
  }

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError(
          "strategy-northstar/forbidden",
          "Only Dirección can add input levers",
        );
      }
      const northStar = await findNorthStar(tx, actor.organizationId);
      if (!northStar) {
        throw new ApplicationError(
          "strategy-northstar/no-north-star",
          "Define the North Star before adding input levers",
        );
      }
      await insertLever(tx, {
        id: randomUUID(),
        organizationId: actor.organizationId,
        northStarId: northStar.id,
        name: lever.name,
        objectiveId: lever.objectiveId,
      });
    },
    client,
  );
}
