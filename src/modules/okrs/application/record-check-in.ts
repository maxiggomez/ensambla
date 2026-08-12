import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import {
  applyCheckInValue,
  type CheckInEvidenceInput,
  validateConfidence,
  validateEvidence,
} from "../domain/check-in";
import { assertMutableObjective } from "../domain/cycle-close";
import { canEditObjective } from "../domain/objective-policy";
import { insertCheckIn } from "../infrastructure/check-in-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";
import {
  findKeyResultWithObjective,
  keyResultValuesFromRow,
  updateKeyResultCurrent,
} from "../infrastructure/key-result-repo";

export interface RecordCheckInInput {
  actorClerkUserId: string;
  keyResultId: string;
  value: unknown;
  confidence: number;
  comment?: string | null;
  evidence?: readonly CheckInEvidenceInput[];
}

export async function recordCheckIn(
  input: RecordCheckInInput,
  client: PrismaClient = prismaClient(),
): Promise<{ checkInId: string }> {
  const confidence = validateConfidence(input.confidence);
  const evidence = (input.evidence ?? []).map(validateEvidence);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const keyResult = await findKeyResultWithObjective(tx, input.keyResultId);
      if (!keyResult) {
        throw new ApplicationError("okrs/key-result-not-found", "Key result not found");
      }
      if (!canEditObjective(actor.role, keyResult.objective.ownerId === actor.id)) {
        throw new ApplicationError(
          "okrs/forbidden",
          "Role not allowed to check in this key result",
        );
      }
      assertMutableObjective(keyResult.objective.status);
      const values = applyCheckInValue(keyResultValuesFromRow(keyResult), input.value);
      const checkInId = randomUUID();
      await updateKeyResultCurrent(tx, keyResult.id, values);
      await insertCheckIn(tx, {
        id: checkInId,
        organizationId: actor.organizationId,
        keyResultId: keyResult.id,
        actorMemberId: actor.id,
        values,
        confidence,
        comment: input.comment?.trim() || null,
        evidence: evidence.map((item) => ({ ...item, id: randomUUID() })),
      });
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "CHECK_IN_RECORDED",
        entityType: "CheckIn",
        entityId: checkInId,
        metadata: { keyResultId: keyResult.id, confidence },
      });
      return { checkInId };
    },
    client,
  );
}
