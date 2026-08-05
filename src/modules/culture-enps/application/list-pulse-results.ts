import { requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { listPulseIds } from "../infrastructure/pulse-repo";

import { getEnpsResults, type EnpsResultsView } from "./get-enps-results";

export async function listPulseResults(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<EnpsResultsView[]> {
  const pulseIds = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listPulseIds(tx);
    },
    client,
  );
  return Promise.all(
    pulseIds.map((pulseId) =>
      getEnpsResults({ actorClerkUserId: input.actorClerkUserId, pulseId }, client),
    ),
  );
}
