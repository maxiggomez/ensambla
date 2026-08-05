import { requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { getMinimumResponses } from "../infrastructure/results-repo";

export async function getCultureEnpsSettings(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<{ minimumResponses: number }> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      return {
        minimumResponses: await getMinimumResponses(tx, actor.organizationId),
      };
    },
    client,
  );
}
