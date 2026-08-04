import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listRitualsWithOccurrences } from "../infrastructure/ritual-repo";

import type { RitualCadence, RitualOccurrenceStatus } from "../../../shared/db";

export interface RitualOccurrenceView {
  occurrenceId: string;
  scheduledDate: string;
  status: RitualOccurrenceStatus;
}

export interface RitualView {
  ritualId: string;
  teamId: string;
  name: string;
  cadence: RitualCadence;
  startDate: string;
  occurrences: RitualOccurrenceView[];
}

/** Ceremonias del tenant con sus ocurrencias (lectura para cualquier miembro). */
export async function listRituals(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<RitualView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const rituals = await listRitualsWithOccurrences(tx);
      return rituals.map((ritual) => ({
        ritualId: ritual.id,
        teamId: ritual.teamId,
        name: ritual.name,
        cadence: ritual.cadence,
        startDate: ritual.startDate.toISOString().slice(0, 10),
        occurrences: ritual.occurrences.map((occurrence) => ({
          occurrenceId: occurrence.id,
          scheduledDate: occurrence.scheduledDate.toISOString().slice(0, 10),
          status: occurrence.status,
        })),
      }));
    },
    client,
  );
}
