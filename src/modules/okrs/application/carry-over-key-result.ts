import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import {
  findCarryOverObjective,
  findCycleKeyResult,
  insertCarryOverObjective,
} from "../infrastructure/cycle-repo";
import { insertKeyResult, keyResultValuesFromRow } from "../infrastructure/key-result-repo";
import { findCycle } from "../infrastructure/objective-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";

export interface CarryOverKeyResultInput {
  actorClerkUserId: string;
  keyResultId: string;
  destinationCycleId: string;
}

export async function carryOverKeyResult(
  input: CarryOverKeyResultInput,
  client: PrismaClient = prismaClient(),
): Promise<{ objectiveId: string; keyResultId: string }> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError("okrs/forbidden", "Only Dirección can carry key results");
      }
      const source = await findCycleKeyResult(tx, input.keyResultId);
      if (!source) {
        throw new ApplicationError("okrs/key-result-not-found", "Key result not found");
      }
      if (source.objective.status !== "Closed") {
        throw new ApplicationError(
          "okrs/invalid-status",
          "Key results can be carried only from a closed objective",
        );
      }
      if (!(await findCycle(tx, input.destinationCycleId))) {
        throw new ApplicationError("okrs/cycle-not-found", "Destination cycle not found");
      }
      let objective = await findCarryOverObjective(
        tx,
        source.objective.id,
        input.destinationCycleId,
      );
      if (!objective) {
        const objectiveId = randomUUID();
        await insertCarryOverObjective(tx, {
          id: objectiveId,
          organizationId: actor.organizationId,
          title: source.objective.title,
          level: source.objective.level,
          ownerId: source.objective.ownerId,
          teamId: source.objective.teamId,
          parentObjectiveId: source.objective.parentObjectiveId,
          cycleId: input.destinationCycleId,
          sourceObjectiveId: source.objective.id,
        });
        objective = await tx.objective.findUniqueOrThrow({ where: { id: objectiveId } });
      }
      const keyResultId = randomUUID();
      await insertKeyResult(tx, {
        id: keyResultId,
        organizationId: actor.organizationId,
        objectiveId: objective.id,
        title: source.title,
        ...keyResultValuesFromRow(source),
        sourceKeyResultId: source.id,
      });
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "KEY_RESULT_CARRIED_OVER",
        entityType: "KeyResult",
        entityId: keyResultId,
        metadata: {
          sourceKeyResultId: source.id,
          destinationCycleId: input.destinationCycleId,
        },
      });
      return { objectiveId: objective.id, keyResultId };
    },
    client,
  );
}
