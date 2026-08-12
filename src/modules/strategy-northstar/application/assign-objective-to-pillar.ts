import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { getObjective } from "../../okrs/application";
import {
  findPillar,
  findPillarObjective,
  insertPillarObjective,
} from "../infrastructure/pillar-repo";

export interface AssignObjectiveToPillarInput {
  actorClerkUserId: string;
  pillarId: string;
  objectiveId: string;
}

/** Agrupa un Objective bajo un pilar del tenant (solo Dirección). */
export async function assignObjectiveToPillar(
  input: AssignObjectiveToPillarInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  try {
    await getObjective(
      { actorClerkUserId: input.actorClerkUserId, objectiveId: input.objectiveId },
      client,
    );
  } catch {
    throw new ApplicationError(
      "strategy-northstar/objective-not-found",
      "Objective not found in this organization",
    );
  }

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError(
          "strategy-northstar/forbidden",
          "Only Dirección can assign objectives to pillars",
        );
      }
      const pillar = await findPillar(tx, input.pillarId);
      if (!pillar || pillar.organizationId !== actor.organizationId) {
        throw new ApplicationError(
          "strategy-northstar/pillar-not-found",
          "Pillar not found in this organization",
        );
      }
      const existing = await findPillarObjective(tx, input.pillarId, input.objectiveId);
      if (existing) {
        throw new ApplicationError(
          "strategy-northstar/already-assigned",
          "Objective is already assigned to this pillar",
        );
      }
      await insertPillarObjective(tx, {
        organizationId: actor.organizationId,
        pillarId: input.pillarId,
        objectiveId: input.objectiveId,
      });
    },
    client,
  );
}
