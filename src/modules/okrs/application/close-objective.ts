import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { assertAllKeyResultsGraded, assertStatusTransition } from "../domain/cycle-close";
import {
  findObjectiveWithKeyResults,
  updateObjectiveStatus,
} from "../infrastructure/objective-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";

export async function closeObjective(
  input: { actorClerkUserId: string; objectiveId: string },
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError("okrs/forbidden", "Only Dirección can close objectives");
      }
      const objective = await findObjectiveWithKeyResults(tx, input.objectiveId);
      if (!objective) {
        throw new ApplicationError("okrs/objective-not-found", "Objective not found");
      }
      assertStatusTransition(objective.status, "Closed");
      assertAllKeyResultsGraded(objective.keyResults.map((keyResult) => keyResult.grade));
      await updateObjectiveStatus(tx, objective.id, "Closed");
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OBJECTIVE_CLOSED",
        entityType: "Objective",
        entityId: objective.id,
      });
    },
    client,
  );
}
