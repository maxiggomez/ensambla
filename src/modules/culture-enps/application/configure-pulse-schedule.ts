import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError, DomainError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { parsePulseScope, type PulseScope } from "../domain/pulse";
import { canManagePulses } from "../domain/pulse-policy";
import { PULSE_FREQUENCIES, type PulseFrequency } from "../domain/recurrence";
import { createPulseSchedule } from "../infrastructure/schedule-repo";

import { resolvePulseAudience } from "./pulse-audience";

export interface ConfigurePulseScheduleInput {
  actorClerkUserId: string;
  scope: PulseScope;
  frequency: PulseFrequency;
  nextRunAt: Date;
}

export async function configurePulseSchedule(
  input: ConfigurePulseScheduleInput,
  client: PrismaClient = prismaClient(),
): Promise<{ scheduleId: string }> {
  const scope = parsePulseScope(input.scope);
  if (!(PULSE_FREQUENCIES as readonly string[]).includes(input.frequency)) {
    throw new DomainError("culture-enps/invalid-frequency", "Invalid pulse frequency");
  }
  if (Number.isNaN(input.nextRunAt.getTime())) {
    throw new DomainError("culture-enps/invalid-next-run", "Invalid next run date");
  }

  const { actor } = await resolvePulseAudience(input.actorClerkUserId, scope, client);
  if (!actor || !canManagePulses(actor.role)) {
    throw new ApplicationError(
      "culture-enps/forbidden",
      "Only Dirección can configure pulse schedules",
    );
  }
  return withTenantForUser(
    input.actorClerkUserId,
    (tx) =>
      createPulseSchedule(tx, {
        organizationId: actor.organizationId,
        scope,
        frequency: input.frequency,
        nextRunAt: input.nextRunAt,
      }),
    client,
  );
}
