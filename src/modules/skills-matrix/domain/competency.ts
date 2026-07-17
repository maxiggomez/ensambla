import { DomainError } from "../../../shared/errors";

/** Level 0–4; el 0 explícito es válido (marca "sin competencia" a propósito). */
export function competencyLevel(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 4) {
    throw new DomainError(
      "skills-matrix/invalid-level",
      "Competency level must be an integer between 0 and 4",
    );
  }
  return value;
}
