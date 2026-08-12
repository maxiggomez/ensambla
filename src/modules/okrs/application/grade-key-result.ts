import { prismaClient, type KeyResultGrade, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { assertMutableObjective } from "../domain/cycle-close";
import { findCycleKeyResult, updateKeyResultGrade } from "../infrastructure/cycle-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";

export interface GradeKeyResultInput {
  actorClerkUserId: string;
  keyResultId: string;
  grade: KeyResultGrade;
}

export async function gradeKeyResult(
  input: GradeKeyResultInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError("okrs/forbidden", "Only Dirección can grade key results");
      }
      const keyResult = await findCycleKeyResult(tx, input.keyResultId);
      if (!keyResult) {
        throw new ApplicationError("okrs/key-result-not-found", "Key result not found");
      }
      assertMutableObjective(keyResult.objective.status);
      if (keyResult.objective.status !== "Published") {
        throw new ApplicationError(
          "okrs/invalid-status",
          "Only a published objective can be graded",
        );
      }
      await updateKeyResultGrade(tx, keyResult.id, input.grade);
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "KEY_RESULT_GRADED",
        entityType: "KeyResult",
        entityId: keyResult.id,
        metadata: { grade: input.grade },
      });
    },
    client,
  );
}
