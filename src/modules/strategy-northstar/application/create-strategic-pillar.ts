import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { strategicPillar } from "../domain/strategic-pillar";
import { insertPillar } from "../infrastructure/pillar-repo";

export interface CreateStrategicPillarInput {
  actorClerkUserId: string;
  name: string;
  description?: string | null;
}

/** Crea un pilar estratégico que agrupa objectives (solo Dirección). */
export async function createStrategicPillar(
  input: CreateStrategicPillarInput,
  client: PrismaClient = prismaClient(),
): Promise<{ pillarId: string }> {
  const pillar = strategicPillar({ name: input.name, description: input.description });

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError(
          "strategy-northstar/forbidden",
          "Only Dirección can create strategic pillars",
        );
      }
      const pillarId = randomUUID();
      await insertPillar(tx, {
        id: pillarId,
        organizationId: actor.organizationId,
        name: pillar.name,
        description: pillar.description,
      });
      return { pillarId };
    },
    client,
  );
}
