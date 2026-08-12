import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";

export interface OkrCycleView {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
}

export async function listOkrCycles(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<OkrCycleView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return tx.okrCycle.findMany({ orderBy: { startsAt: "desc" } });
    },
    client,
  );
}
