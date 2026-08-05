import { listMembers } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canManagePulses } from "../domain/pulse-policy";
import { nextOccurrence } from "../domain/recurrence";
import {
  claimScheduleAndCreatePulse,
  listDuePulseSchedules,
} from "../infrastructure/schedule-repo";

import { resolvePulseAudience } from "./pulse-audience";

export interface GenerateDuePulsesInput {
  actorClerkUserId: string;
  now: Date;
}

export async function generateDuePulses(
  input: GenerateDuePulsesInput,
  client: PrismaClient = prismaClient(),
): Promise<{ generatedPulseIds: string[] }> {
  const members = await listMembers({ actorClerkUserId: input.actorClerkUserId }, client);
  const actor = members.find((member) => member.clerkUserId === input.actorClerkUserId);
  if (!actor || !canManagePulses(actor.role)) {
    throw new ApplicationError(
      "culture-enps/forbidden",
      "Only Dirección can generate recurring pulses",
    );
  }

  const schedules = await withTenantForUser(
    input.actorClerkUserId,
    (tx) => listDuePulseSchedules(tx, input.now),
    client,
  );
  const generatedPulseIds: string[] = [];
  for (const schedule of schedules) {
    const { memberIds } = await resolvePulseAudience(
      input.actorClerkUserId,
      schedule.scope,
      client,
    );
    const pulseId = await withTenantForUser(
      input.actorClerkUserId,
      (tx) =>
        claimScheduleAndCreatePulse(tx, {
          scheduleId: schedule.id,
          organizationId: schedule.organizationId,
          scope: schedule.scope,
          memberIds,
          scheduledFor: schedule.scheduledFor,
          nextRunAt: nextOccurrence(schedule.scheduledFor, schedule.frequency),
        }),
      client,
    );
    if (pulseId !== null) generatedPulseIds.push(pulseId);
  }
  return { generatedPulseIds };
}
