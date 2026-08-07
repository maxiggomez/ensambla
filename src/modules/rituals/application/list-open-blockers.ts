import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listOpenBlockersWithObjective } from "../infrastructure/blocker-repo";

export interface BlockerObjectiveView {
  id: string;
  title: string;
}

export interface BlockerView {
  blockerId: string;
  teamId: string;
  ownerId: string;
  title: string;
  description: string | null;
  createdAt: string;
  objective: BlockerObjectiveView | null;
}

/** Blockers abiertos con su Objective asociado (lectura para cualquier miembro). */
export async function listOpenBlockers(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<BlockerView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const blockers = await listOpenBlockersWithObjective(tx);
      return blockers.map((blocker) => ({
        blockerId: blocker.id,
        teamId: blocker.teamId,
        ownerId: blocker.memberId,
        title: blocker.title,
        description: blocker.description,
        createdAt: blocker.createdAt.toISOString(),
        objective: blocker.objective,
      }));
    },
    client,
  );
}
