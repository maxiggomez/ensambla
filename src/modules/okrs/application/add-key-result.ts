import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import type { TextState } from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import type { MeasurementKind } from "../domain/key-result";
import { objectiveTitle } from "../domain/objective";
import { canEditObjective } from "../domain/objective-policy";
import { insertKeyResult } from "../infrastructure/key-result-repo";
import { findObjectiveWithKeyResults } from "../infrastructure/objective-repo";

export interface AddKeyResultInput {
  actorClerkUserId: string;
  objectiveId: string;
  title: string;
  measurementType: MeasurementKind;
  startValue?: number | null;
  targetValue?: number | null;
  currentValue?: number | null;
  checkDone?: boolean | null;
  textState?: TextState | null;
}

/**
 * Agrega un KeyResult al Objective. Puede guardarse incompleto mientras el
 * Objective está en draft; la validez completa la exige `publishObjective`.
 */
export async function addKeyResult(
  input: AddKeyResultInput,
  client: PrismaClient = prismaClient(),
): Promise<{ keyResultId: string }> {
  const title = objectiveTitle(input.title);

  return withTenantForUser(
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

      const keyResultId = randomUUID();
      await insertKeyResult(tx, {
        id: keyResultId,
        organizationId: actor.organizationId,
        objectiveId: objective.id,
        title,
        measurementType: input.measurementType,
        startValue: input.startValue,
        targetValue: input.targetValue,
        currentValue: input.currentValue,
        checkDone: input.checkDone,
        textState: input.textState,
      });
      return { keyResultId };
    },
    client,
  );
}
