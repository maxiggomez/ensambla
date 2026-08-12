import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { assertPublishable } from "../domain/objective";
import { assertMutableObjective } from "../domain/cycle-close";
import { canEditObjective } from "../domain/objective-policy";
import { insertAuditEvent } from "../infrastructure/audit-repo";
import { keyResultValuesFromRow } from "../infrastructure/key-result-repo";
import {
  findObjectiveWithKeyResults,
  updateObjectiveStatus,
} from "../infrastructure/objective-repo";

export interface PublishObjectiveInput {
  actorClerkUserId: string;
  objectiveId: string;
}

/** Publica el Objective si tiene ≥1 KR y todos son Measurements válidos. */
export async function publishObjective(
  input: PublishObjectiveInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const objective = await findObjectiveWithKeyResults(tx, input.objectiveId);
      if (!objective) {
        throw new ApplicationError("okrs/objective-not-found", "Objective not found");
      }
      if (!canEditObjective(actor.role, objective.ownerId === actor.id)) {
        throw new ApplicationError(
          "okrs/forbidden",
          "Role not allowed to publish this objective",
        );
      }
      assertMutableObjective(objective.status);

      assertPublishable(objective.keyResults.map(keyResultValuesFromRow));
      await updateObjectiveStatus(tx, objective.id, "Published");
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OBJECTIVE_PUBLISHED",
        entityType: "Objective",
        entityId: objective.id,
      });
    },
    client,
  );
}
