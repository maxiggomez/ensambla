import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { generateOccurrenceDates } from "../domain/cadence";
import { canManageRituals } from "../domain/policy";
import {
  findRitualById,
  insertOccurrences,
  listOccurrencesByRitual,
} from "../infrastructure/ritual-repo";

export interface GenerateRitualOccurrencesInput {
  actorClerkUserId: string;
  ritualId: string;
  throughDate: Date;
}

export async function generateRitualOccurrences(
  input: GenerateRitualOccurrencesInput,
  client: PrismaClient = prismaClient(),
): Promise<{ generated: number }> {
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
      const dates = generateOccurrenceDates({
        startDate: ritual.startDate,
        cadence: ritual.cadence,
        throughDate: input.throughDate,
      });
      const existing = await listOccurrencesByRitual(tx, ritual.id);
      const existingDates = new Set(
        existing.map((o) => o.scheduledDate.toISOString().slice(0, 10)),
      );
      const toInsert = dates.filter(
        (date) => !existingDates.has(date.toISOString().slice(0, 10)),
      );
      await insertOccurrences(
        tx,
        toInsert.map((scheduledDate) => ({
          id: randomUUID(),
          organizationId: ritual.organizationId,
          ritualId: ritual.id,
          scheduledDate,
          status: "Scheduled",
        })),
      );
      return { generated: toInsert.length };
    },
    client,
  );
}
