import { DomainError } from "../errors";

import { measurementSchema, type Measurement, type TextState } from "./measurement";

/**
 * Mapeo del `Measurement` a sus columnas tipadas (ADR-0004): discriminador +
 * valores queryables, nunca EAV. Lo comparten los repos de `okrs` y
 * `strategy-northstar` para que agregar un tipo siga tocando un solo lugar.
 * Los literales de columna replican los enums de Prisma sin importar Prisma
 * (el shared kernel de dominio se mantiene puro).
 */

export type MeasurementTypeColumn = "Check" | "Percentage" | "Integer" | "Currency" | "Text";
export type TextStateColumn = "NotStarted" | "InProgress" | "Done";

const COLUMN_BY_KIND: Record<Measurement["type"], MeasurementTypeColumn> = {
  check: "Check",
  percentage: "Percentage",
  integer: "Integer",
  currency: "Currency",
  text: "Text",
};

const KIND_BY_COLUMN: Record<MeasurementTypeColumn, Measurement["type"]> = {
  Check: "check",
  Percentage: "percentage",
  Integer: "integer",
  Currency: "currency",
  Text: "text",
};

const COLUMN_BY_TEXT_STATE: Record<TextState, TextStateColumn> = {
  not_started: "NotStarted",
  in_progress: "InProgress",
  done: "Done",
};

const TEXT_STATE_BY_COLUMN: Record<TextStateColumn, TextState> = {
  NotStarted: "not_started",
  InProgress: "in_progress",
  Done: "done",
};

export function columnFromMeasurementKind(kind: Measurement["type"]): MeasurementTypeColumn {
  return COLUMN_BY_KIND[kind];
}

export function measurementKindFromColumn(column: MeasurementTypeColumn): Measurement["type"] {
  return KIND_BY_COLUMN[column];
}

export function columnFromTextState(state: TextState): TextStateColumn {
  return COLUMN_BY_TEXT_STATE[state];
}

export function textStateFromColumn(column: TextStateColumn): TextState {
  return TEXT_STATE_BY_COLUMN[column];
}

export interface MeasurementColumns {
  measurementType: MeasurementTypeColumn;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  checkDone: boolean | null;
  textState: TextStateColumn | null;
}

export function measurementToColumns(measurement: Measurement): MeasurementColumns {
  const base: MeasurementColumns = {
    measurementType: columnFromMeasurementKind(measurement.type),
    startValue: null,
    targetValue: null,
    currentValue: null,
    checkDone: null,
    textState: null,
  };
  switch (measurement.type) {
    case "check":
      return { ...base, checkDone: measurement.done };
    case "text":
      return { ...base, textState: columnFromTextState(measurement.state) };
    case "percentage":
    case "integer":
    case "currency":
      return {
        ...base,
        startValue: measurement.start,
        targetValue: measurement.target,
        currentValue: measurement.current,
      };
  }
}

/** Una fila que no parsea como `Measurement` es un bug de datos, no un estado válido. */
export function measurementFromColumns(columns: MeasurementColumns): Measurement {
  const kind = measurementKindFromColumn(columns.measurementType);
  const candidate =
    kind === "check"
      ? { type: kind, done: columns.checkDone ?? undefined }
      : kind === "text"
        ? {
            type: kind,
            state:
              columns.textState === null ? undefined : textStateFromColumn(columns.textState),
          }
        : {
            type: kind,
            start: columns.startValue ?? undefined,
            target: columns.targetValue ?? undefined,
            current: columns.currentValue ?? undefined,
          };
  const parsed = measurementSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new DomainError(
      "measurement/invalid-columns",
      `Stored columns do not form a valid ${kind} measurement`,
    );
  }
  return parsed.data;
}
