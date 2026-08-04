import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { canManageRituals } from "../domain/policy";
import { evaluateRitualOccurrence } from "../domain/ritual-status";
import {
  findRitualById,
  listOccurrencesByRitual,
  updateOccurrenceStatus,
} from "../infrastructure/ritual-repo";

export interface EvaluateRitualStatusInput {
  actorClerkUserId: string;
  ritualId: string;
}

export async function evaluateRitualStatus(
  input: EvaluateRitualStatusInput,
  client: PrismaClient = prismaClient(),
): Promise<{ overdue: number }> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageRituals(actor.role)) {
        throw new ApplicationError("rituals/forbidden", "Role not allowed to manage rituals");
      }
      const ritual = await findRitualById(tx, input.ritualId);
      if (!ritual) {
        throw new ApplicationError("rituals/ritual-not-found", "Ritual not found");
      }
      const occurrences = await listOccurrencesByRitual(tx, ritual.id);
      const now = new Date();
      let overdue = 0;
      for (const occurrence of occurrences) {
        const status = evaluateRitualOccurrence({
          status: occurrence.status,
          scheduledDate: occurrence.scheduledDate,
          now,
        });
        if (status !== occurrence.status) {
          await updateOccurrenceStatus(tx, occurrence.id, status);
          if (status === "Overdue") {
            overdue += 1;
          }
        }
      }
      return { overdue };
    },
    client,
  );
}
