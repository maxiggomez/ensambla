import { requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { listPendingPulseRows, type PendingPulseRow } from "../infrastructure/response-repo";

export async function listPendingPulses(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<PendingPulseRow[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      return listPendingPulseRows(tx, actor.id);
    },
    client,
  );
}
