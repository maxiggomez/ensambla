import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { strategyStatement } from "../domain/strategy-statement";
import { updateStrategyStatements, type StrategyPatch } from "../infrastructure/strategy-repo";

export interface DefineStrategyInput {
  actorClerkUserId: string;
  vision?: string | null;
  mission?: string | null;
  values?: string[] | null;
}

/** Define o redefine visión, misión y valores de la Organization (solo Dirección).
 * Los campos ausentes se conservan (actualización parcial). */
export async function defineStrategy(
  input: DefineStrategyInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const statements = strategyStatement({
    vision: input.vision,
    mission: input.mission,
    values: input.values,
  });
  const patch: StrategyPatch = {};
  if (input.vision !== undefined) patch.vision = statements.vision;
  if (input.mission !== undefined) patch.mission = statements.mission;
  if (input.values !== undefined) patch.values = statements.values;

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError(
          "strategy-northstar/forbidden",
          "Only Dirección can define the strategy",
        );
      }
      await updateStrategyStatements(tx, actor.organizationId, patch);
    },
    client,
  );
}
