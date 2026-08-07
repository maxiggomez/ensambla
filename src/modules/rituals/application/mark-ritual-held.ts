import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { canManageRituals } from "../domain/policy";
import { holdRitualOccurrence } from "../domain/ritual-status";
import { findOccurrenceById, updateOccurrenceStatus } from "../infrastructure/ritual-repo";

export interface MarkRitualHeldInput {
  actorClerkUserId: string;
  occurrenceId: string;
}

export async function markRitualHeld(
  input: MarkRitualHeldInput,
  client: PrismaClient = prismaClient(),
): Promise<{ occurrenceId: string }> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageRituals(actor.role)) {
        throw new ApplicationError("rituals/forbidden", "Role not allowed to manage rituals");
      }
      const occurrence = await findOccurrenceById(tx, input.occurrenceId);
      if (!occurrence) {
        throw new ApplicationError(
          "rituals/occurrence-not-found",
          "Ritual occurrence not found",
        );
      }
      await updateOccurrenceStatus(tx, occurrence.id, holdRitualOccurrence(), new Date());
      return { occurrenceId: occurrence.id };
    },
    client,
  );
}
