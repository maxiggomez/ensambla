import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { objectiveTitle, type ObjectiveLevel } from "../domain/objective";
import { canCreateObjective } from "../domain/objective-policy";
import { findOwnerMember, insertObjective } from "../infrastructure/objective-repo";

export interface CreateObjectiveInput {
  actorClerkUserId: string;
  title: string;
  level: ObjectiveLevel;
  ownerMemberId: string;
}

/** Crea un Objective en draft con nivel y owner, según la policy por rol. */
export async function createObjective(
  input: CreateObjectiveInput,
  client: PrismaClient = prismaClient(),
): Promise<{ objectiveId: string }> {
  const title = objectiveTitle(input.title);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canCreateObjective(actor.role, input.level)) {
        throw new ApplicationError(
          "okrs/forbidden",
          `Role not allowed to create a ${input.level}-level objective`,
        );
      }
      // Lookup RLS-scoped: un ownerMemberId de otro tenant no existe acá.
      const owner = await findOwnerMember(tx, input.ownerMemberId);
      if (!owner) {
        throw new ApplicationError("okrs/owner-not-found", "Owner member not found");
      }

      const objectiveId = randomUUID();
      await insertObjective(tx, {
        id: objectiveId,
        organizationId: actor.organizationId,
        title,
        level: input.level,
        ownerId: owner.id,
      });
      return { objectiveId };
    },
    client,
  );
}
