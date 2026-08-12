import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { assertAcyclicAlignment } from "../domain/alignment";
import { assertMutableObjective } from "../domain/cycle-close";
import { canEditObjective } from "../domain/objective-policy";
import { readObjectiveChain, updateObjectiveParent } from "../infrastructure/alignment-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";
import { findObjectiveWithKeyResults } from "../infrastructure/objective-repo";

export interface LinkObjectiveParentInput {
  actorClerkUserId: string;
  objectiveId: string;
  parentObjectiveId: string;
}

export async function linkObjectiveParent(
  input: LinkObjectiveParentInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const objective = await findObjectiveWithKeyResults(tx, input.objectiveId);
      const parent = await findObjectiveWithKeyResults(tx, input.parentObjectiveId);
      if (!objective || !parent) {
        throw new ApplicationError("okrs/objective-not-found", "Objective not found");
      }
      if (!canEditObjective(actor.role, objective.ownerId === actor.id)) {
        throw new ApplicationError("okrs/forbidden", "Role not allowed to align objective");
      }
      assertMutableObjective(objective.status);
      const parentChain = await readObjectiveChain(tx, parent.id);
      assertAcyclicAlignment(
        objective.id,
        parent.id,
        parentChain.map((item) => item.id),
      );
      await updateObjectiveParent(tx, objective.id, parent.id);
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OBJECTIVE_PARENT_LINKED",
        entityType: "Objective",
        entityId: objective.id,
        metadata: { parentObjectiveId: parent.id },
      });
    },
    client,
  );
}
