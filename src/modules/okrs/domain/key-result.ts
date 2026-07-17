import { DomainError } from "../../../shared/errors";
import {
  measurementSchema,
  type Measurement,
  type TextState,
} from "../../../shared/measurement";

export type MeasurementKind = Measurement["type"];

/**
 * Valores tal como se guardan mientras el Objective está en draft: un KR
 * numérico puede estar incompleto (sin start/target). La validez real la
 * define `toMeasurement`, que es la barrera de publicación.
 */
export interface KeyResultValues {
  measurementType: MeasurementKind;
  startValue?: number | null;
  targetValue?: number | null;
  currentValue?: number | null;
  checkDone?: boolean | null;
  textState?: TextState | null;
}

/**
 * Mapea los valores guardados al `Measurement` tipado (ADR-0004). Defaults:
 * check arranca no hecho, text arranca `not_started`, y el valor actual de un
 * numérico arranca en su start. Lanza `okrs/key-result-invalid` si los valores
 * no forman un Measurement válido (p. ej. numérico sin start o target).
 */
export function toMeasurement(values: KeyResultValues): Measurement {
  const parsed = measurementSchema.safeParse(candidateFor(values));
  if (!parsed.success) {
    throw new DomainError(
      "okrs/key-result-invalid",
      `Key result values do not form a valid ${values.measurementType} measurement`,
    );
  }
  return parsed.data;
}

export function isValidForPublishing(values: KeyResultValues): boolean {
  try {
    toMeasurement(values);
    return true;
  } catch {
    return false;
  }
}

function candidateFor(values: KeyResultValues): unknown {
  switch (values.measurementType) {
    case "check":
      return { type: "check", done: values.checkDone ?? false };
    case "text":
      return { type: "text", state: values.textState ?? "not_started" };
    case "percentage":
    case "integer":
    case "currency":
      return {
        type: values.measurementType,
        start: values.startValue ?? undefined,
        target: values.targetValue ?? undefined,
        current: values.currentValue ?? values.startValue ?? undefined,
      };
  }
}
