import { progress, type Measurement } from "../../../shared/measurement";

import { isValidForPublishing, toMeasurement, type KeyResultValues } from "./key-result";

/**
 * 🔒 Roll-up (ADR-0004): el progreso de un Objective es el promedio de los
 * progresos de sus KeyResults (pesos iguales en el MVP). Nunca se persiste ni
 * se edita a mano: se deriva en cada lectura. `[]` → 0 (un draft sin KRs no
 * avanza; publicar exige ≥1 KR).
 */
export function rollUp(measurements: readonly Measurement[]): number {
  if (measurements.length === 0) {
    return 0;
  }
  const total = measurements.reduce((sum, measurement) => sum + progress(measurement), 0);
  return total / measurements.length;
}

/**
 * Progreso de un KR desde sus valores guardados. Un KR incompleto (solo
 * posible en draft) todavía no avanza: 0.
 */
export function keyResultProgress(values: KeyResultValues): number {
  return isValidForPublishing(values) ? progress(toMeasurement(values)) : 0;
}

/** Roll-up 🔒 sobre valores guardados (drafts incluidos): promedio de `keyResultProgress`. */
export function objectiveProgress(keyResults: readonly KeyResultValues[]): number {
  if (keyResults.length === 0) {
    return 0;
  }
  const total = keyResults.reduce((sum, values) => sum + keyResultProgress(values), 0);
  return total / keyResults.length;
}
