import { DomainError } from "../../../shared/errors";

import { toMeasurement, type KeyResultValues } from "./key-result";

export const OBJECTIVE_LEVELS = ["Company", "Area", "Team", "Person"] as const;
export type ObjectiveLevel = (typeof OBJECTIVE_LEVELS)[number];

export type ObjectiveStatus = "Draft" | "Published";

export function objectiveTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("okrs/invalid-title", "Objective title must not be empty");
  }
  return trimmed;
}

/**
 * Invariante de publicación: un Objective exige al menos un KeyResult y todos
 * deben mapear a un `Measurement` válido. Lanza `okrs/objective-without-key-results`
 * o `okrs/key-result-invalid`.
 */
export function assertPublishable(keyResults: readonly KeyResultValues[]): void {
  if (keyResults.length === 0) {
    throw new DomainError(
      "okrs/objective-without-key-results",
      "An objective cannot be published without at least one key result",
    );
  }
  for (const keyResult of keyResults) {
    toMeasurement(keyResult);
  }
}
