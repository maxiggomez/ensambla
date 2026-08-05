import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canManagePulses } from "../domain/pulse-policy";
import { parsePulseScope, type PulseScope } from "../domain/pulse";
import { createPulseWithAudience } from "../infrastructure/pulse-repo";

import { resolvePulseAudience } from "./pulse-audience";

export interface LaunchPulseInput {
  actorClerkUserId: string;
  scope: PulseScope;
}

export async function launchPulse(
  input: LaunchPulseInput,
  client: PrismaClient = prismaClient(),
): Promise<{ pulseId: string }> {
  const scope = parsePulseScope(input.scope);
  const { actor, memberIds } = await resolvePulseAudience(
    input.actorClerkUserId,
    scope,
    client,
  );
  if (!actor || !canManagePulses(actor.role)) {
    throw new ApplicationError("culture-enps/forbidden", "Only Dirección can launch pulses");
  }
  return withTenantForUser(
    input.actorClerkUserId,
    (tx) =>
      createPulseWithAudience(tx, { organizationId: actor.organizationId, scope, memberIds }),
    client,
  );
}
