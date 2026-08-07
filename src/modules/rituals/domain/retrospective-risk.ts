import { DomainError } from "../../../shared/errors";

/** Régimen de ciclos de retrospectiva por defecto (biweekly). */
export const DEFAULT_RETRO_CYCLE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function retroCycleDays(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError(
      "rituals/invalid-cycle-days",
      "Retrospective cycle length must be a positive integer",
    );
  }
  return value;
}

/**
 * Riesgo de aprendizaje derivado (Scenario "Missing retrospective"): un Team
 * lleva riesgo cuando transcurrieron ≥ 2 ciclos desde su última retrospectiva,
 * o cuando nunca tuvo una. Flag calculado, nunca persisted.
 */
export function evaluateRetroRisk(input: {
  lastRetroDate: Date | null;
  cycleDays: number;
  now: Date;
}): boolean {
  if (input.lastRetroDate === null) {
    return true;
  }
  const elapsedDays = (input.now.getTime() - input.lastRetroDate.getTime()) / DAY_MS;
  const cycles = Math.floor(elapsedDays / input.cycleDays);
  return cycles >= 2;
}
