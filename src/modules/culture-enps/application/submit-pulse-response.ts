import { requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import type { Driver } from "../domain/driver";
import { createPulseResponse } from "../domain/pulse-response";
import { storeAnonymousResponse } from "../infrastructure/response-repo";

export interface SubmitPulseResponseInput {
  actorClerkUserId: string;
  pulseId: string;
  score: number;
  driver: Driver;
  comment?: string;
}

export async function submitPulseResponse(
  input: SubmitPulseResponseInput,
  client: PrismaClient = prismaClient(),
): Promise<{ submitted: true }> {
  const response = createPulseResponse(input);
  const submittedAt = new Date();
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      await storeAnonymousResponse(tx, {
        organizationId: actor.organizationId,
        memberId: actor.id,
        pulseId: input.pulseId,
        response,
        submittedAt,
      });
    },
    client,
  );
  return { submitted: true };
}
