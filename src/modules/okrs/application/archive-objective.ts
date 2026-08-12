import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { assertStatusTransition } from "../domain/cycle-close";
import {
  findObjectiveWithKeyResults,
  updateObjectiveStatus,
} from "../infrastructure/objective-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";

export async function archiveObjective(
  input: { actorClerkUserId: string; objectiveId: string },
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError("okrs/forbidden", "Only Dirección can archive objectives");
      }
      const objective = await findObjectiveWithKeyResults(tx, input.objectiveId);
      if (!objective) {
        throw new ApplicationError("okrs/objective-not-found", "Objective not found");
      }
      assertStatusTransition(objective.status, "Archived");
      await updateObjectiveStatus(tx, objective.id, "Archived");
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OBJECTIVE_ARCHIVED",
        entityType: "Objective",
        entityId: objective.id,
      });
    },
    client,
  );
}
