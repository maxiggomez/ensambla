import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { measurementToColumns } from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { northStar } from "../domain/north-star";
import { upsertNorthStar } from "../infrastructure/north-star-repo";

export interface DefineNorthStarInput {
  actorClerkUserId: string;
  name: string;
  measurement: unknown;
}

/** Define o redefine la North Star (una por Organización, solo Dirección). */
export async function defineNorthStar(
  input: DefineNorthStarInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const definition = northStar({ name: input.name, measurement: input.measurement });

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError(
          "strategy-northstar/forbidden",
          "Only Dirección can define the North Star",
        );
      }
      await upsertNorthStar(tx, {
        organizationId: actor.organizationId,
        name: definition.name,
        columns: measurementToColumns(definition.measurement),
      });
    },
    client,
  );
}
