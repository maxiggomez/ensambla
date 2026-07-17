import type { MeasurementKind } from "../domain/key-result";
import type { ObjectiveLevel, ObjectiveStatus } from "../domain/objective";
import { keyResultProgress, objectiveProgress } from "../domain/roll-up";
import { keyResultValuesFromRow } from "../infrastructure/key-result-repo";
import type { ObjectiveWithKeyResults } from "../infrastructure/objective-repo";

export interface KeyResultView {
  id: string;
  title: string;
  measurementType: MeasurementKind;
  progress: number;
}

export interface ObjectiveView {
  id: string;
  title: string;
  level: ObjectiveLevel;
  status: ObjectiveStatus;
  ownerId: string;
  /** 🔒 Derivado por roll-up (ADR-0004); nunca persistido ni editable. */
  progress: number;
  keyResults: KeyResultView[];
}

export function toObjectiveView(row: ObjectiveWithKeyResults): ObjectiveView {
  const keyResults = row.keyResults.map((keyResult) => ({
    row: keyResult,
    values: keyResultValuesFromRow(keyResult),
  }));
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    status: row.status,
    ownerId: row.ownerId,
    progress: objectiveProgress(keyResults.map((keyResult) => keyResult.values)),
    keyResults: keyResults.map(({ row: keyResultRow, values }) => ({
      id: keyResultRow.id,
      title: keyResultRow.title,
      measurementType: values.measurementType,
      progress: keyResultProgress(values),
    })),
  };
}
