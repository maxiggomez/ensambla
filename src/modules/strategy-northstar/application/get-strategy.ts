import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { findStrategyStatements } from "../infrastructure/strategy-repo";

export interface GetStrategyInput {
  actorClerkUserId: string;
}

export interface StrategyView {
  vision: string | null;
  mission: string | null;
  values: string[];
}

/** Estatutos de la Organization del actor; legibles por cualquier miembro. */
export async function getStrategy(
  input: GetStrategyInput,
  client: PrismaClient = prismaClient(),
): Promise<StrategyView> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      return findStrategyStatements(tx, actor.organizationId);
    },
    client,
  );
}
