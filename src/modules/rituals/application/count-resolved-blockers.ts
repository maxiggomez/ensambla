import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { countBlockersByStatus } from "../infrastructure/blocker-repo";

/** Métrica de resueltos: conteo derivado de Blockers con status Resolved. */
export async function countResolvedBlockers(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<number> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return countBlockersByStatus(tx, "Resolved");
    },
    client,
  );
}
