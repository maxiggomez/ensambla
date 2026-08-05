import { requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { parseMinimumResponses } from "../domain/minimum-responses";
import { canManagePulses } from "../domain/pulse-policy";
import { updateMinimumResponses } from "../infrastructure/results-repo";

export interface ConfigureMinimumResponsesInput {
  actorClerkUserId: string;
  minimumResponses: number;
}

export async function configureMinimumResponses(
  input: ConfigureMinimumResponsesInput,
  client: PrismaClient = prismaClient(),
): Promise<{ minimumResponses: number }> {
  const minimumResponses = parseMinimumResponses(input.minimumResponses);
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManagePulses(actor.role)) {
        throw new ApplicationError(
          "culture-enps/forbidden",
          "Only Dirección can configure the minimum response threshold",
        );
      }
      await updateMinimumResponses(tx, actor.organizationId, minimumResponses);
    },
    client,
  );
  return { minimumResponses };
}
