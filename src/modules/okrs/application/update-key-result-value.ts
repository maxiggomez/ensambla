import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError, DomainError } from "../../../shared/errors";
import { textStateSchema, type TextState } from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { toMeasurement, type KeyResultValues } from "../domain/key-result";
import { canEditObjective } from "../domain/objective-policy";
import {
  findKeyResultWithObjective,
  keyResultValuesFromRow,
  updateKeyResultCurrent,
} from "../infrastructure/key-result-repo";

export interface UpdateKeyResultValueInput {
  actorClerkUserId: string;
  keyResultId: string;
  /** number para tipos numéricos, boolean para check, TextState para text. */
  value: number | boolean | TextState;
}

/**
 * Actualiza el valor actual de un KR. El progreso (del KR y del Objective) no
 * se toca acá: se deriva siempre en lectura (roll-up 🔒, ADR-0004).
 */
export async function updateKeyResultValue(
  input: UpdateKeyResultValueInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
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
          "Role not allowed to update this key result",
        );
      }

      const updated = applyValue(keyResultValuesFromRow(keyResult), input.value);
      // Valida que los valores actualizados sigan formando un Measurement válido.
      toMeasurement(updated);
      await updateKeyResultCurrent(tx, keyResult.id, updated);
    },
    client,
  );
}

function applyValue(values: KeyResultValues, value: unknown): KeyResultValues {
  switch (values.measurementType) {
    case "check": {
      if (typeof value !== "boolean") {
        throw mismatch("check", "boolean");
      }
      return { ...values, checkDone: value };
    }
    case "text": {
      const state = textStateSchema.safeParse(value);
      if (!state.success) {
        throw mismatch("text", "text state");
      }
      return { ...values, textState: state.data };
    }
    case "percentage":
    case "integer":
    case "currency": {
      if (typeof value !== "number") {
        throw mismatch(values.measurementType, "number");
      }
      return { ...values, currentValue: value };
    }
  }
}

function mismatch(kind: string, expected: string): DomainError {
  return new DomainError(
    "okrs/value-type-mismatch",
    `A ${kind} key result expects a ${expected} value`,
  );
}
