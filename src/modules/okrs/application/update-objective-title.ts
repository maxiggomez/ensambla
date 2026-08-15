import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { assertMutableObjective } from "../domain/cycle-close";
import { objectiveTitle } from "../domain/objective";
import { canEditObjective } from "../domain/objective-policy";
import { insertAuditEvent } from "../infrastructure/audit-repo";
import {
  findObjectiveWithKeyResults,
  updateObjectiveTitle as persistObjectiveTitle,
} from "../infrastructure/objective-repo";

export interface UpdateObjectiveTitleInput {
  actorClerkUserId: string;
  objectiveId: string;
  title: string;
}

export async function updateObjectiveTitle(
  input: UpdateObjectiveTitleInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const title = objectiveTitle(input.title);
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const objective = await findObjectiveWithKeyResults(tx, input.objectiveId);
      if (!objective) {
        throw new ApplicationError("okrs/objective-not-found", "Objective not found");
      }
      if (!canEditObjective(actor.role, objective.ownerId === actor.id)) {
        throw new ApplicationError("okrs/forbidden", "Role not allowed to edit this objective");
      }
      assertMutableObjective(objective.status);
      await persistObjectiveTitle(tx, objective.id, title);
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OBJECTIVE_TITLE_UPDATED",
        entityType: "Objective",
        entityId: objective.id,
      });
    },
    client,
  );
}
