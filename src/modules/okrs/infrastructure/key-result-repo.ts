import type { KeyResult, Objective, TenantClient } from "../../../shared/db";
import {
  columnFromMeasurementKind,
  columnFromTextState,
  measurementKindFromColumn,
  textStateFromColumn,
} from "../../../shared/measurement";
import type { KeyResultValues } from "../domain/key-result";

function toNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/** Fila → valores de dominio (Decimal → number, enums de columna → literales). */
export function keyResultValuesFromRow(row: KeyResult): KeyResultValues {
  return {
    measurementType: measurementKindFromColumn(row.measurementType),
    startValue: toNumber(row.startValue),
    targetValue: toNumber(row.targetValue),
    currentValue: toNumber(row.currentValue),
    checkDone: row.checkDone,
    textState: row.textState === null ? null : textStateFromColumn(row.textState),
  };
}

export interface InsertKeyResultInput extends KeyResultValues {
  id: string;
  organizationId: string;
  objectiveId: string;
  title: string;
}

export async function insertKeyResult(
  tx: TenantClient,
  input: InsertKeyResultInput,
): Promise<void> {
  await tx.keyResult.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      objectiveId: input.objectiveId,
      title: input.title,
      measurementType: columnFromMeasurementKind(input.measurementType),
      startValue: input.startValue ?? null,
      targetValue: input.targetValue ?? null,
      currentValue: input.currentValue ?? null,
      checkDone: input.checkDone ?? null,
      textState: input.textState == null ? null : columnFromTextState(input.textState),
    },
  });
}

export function findKeyResultWithObjective(
  tx: TenantClient,
  id: string,
): Promise<(KeyResult & { objective: Objective }) | null> {
  return tx.keyResult.findUnique({ where: { id }, include: { objective: true } });
}

export async function updateKeyResultCurrent(
  tx: TenantClient,
  id: string,
  values: Pick<KeyResultValues, "currentValue" | "checkDone" | "textState">,
): Promise<void> {
  await tx.keyResult.update({
    where: { id },
    data: {
      currentValue: values.currentValue ?? undefined,
      checkDone: values.checkDone ?? undefined,
      textState: values.textState == null ? undefined : columnFromTextState(values.textState),
    },
  });
}
