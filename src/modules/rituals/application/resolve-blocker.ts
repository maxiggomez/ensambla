import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { resolveBlocker as resolveBlockerDomain } from "../domain/blocker";
import { canManageRituals } from "../domain/policy";
import { findBlockerById, updateBlockerStatus } from "../infrastructure/blocker-repo";

export interface ResolveBlockerInput {
  actorClerkUserId: string;
  blockerId: string;
}

export async function resolveBlocker(
  input: ResolveBlockerInput,
  client: PrismaClient = prismaClient(),
): Promise<{ blockerId: string }> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageRituals(actor.role)) {
        throw new ApplicationError("rituals/forbidden", "Role not allowed to manage rituals");
      }
      const blocker = await findBlockerById(tx, input.blockerId);
      if (!blocker) {
        throw new ApplicationError("rituals/blocker-not-found", "Blocker not found");
      }
      const resolved = resolveBlockerDomain({ status: blocker.status, now: new Date() });
      await updateBlockerStatus(tx, blocker.id, resolved.status, resolved.resolvedAt);
      return { blockerId: blocker.id };
    },
    client,
  );
}
