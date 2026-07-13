import { prismaClient, type Member, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { listAllMembers } from "../infrastructure/member-repo";

import { requireActor } from "./actor";

/** Members of the actor's organization (visible to every role). */
export async function listMembers(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<Member[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listAllMembers(tx);
    },
    client,
  );
}
