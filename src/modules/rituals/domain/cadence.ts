import { DomainError } from "../../../shared/errors";

export const RITUAL_CADENCES = ["Weekly", "Biweekly", "Monthly"] as const;
export type RitualCadence = (typeof RITUAL_CADENCES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export function ritualName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("rituals/invalid-name", "Ritual name must not be empty");
  }
  return trimmed;
}

export function ritualCadence(value: string): RitualCadence {
  if (!RITUAL_CADENCES.includes(value as RitualCadence)) {
    throw new DomainError(
      "rituals/invalid-cadence",
      `Cadence must be one of ${RITUAL_CADENCES.join(", ")}`,
    );
  }
  return value as RitualCadence;
}

/** Normaliza a medianoche UTC para comparar por día de calendario. */
function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** Próxima fecha de cadencia estrictamente posterior a `base`. */
export function addCadence(base: Date, cadence: RitualCadence): Date {
  const next = new Date(base);
  switch (cadence) {
    case "Weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "Biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "Monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return startOfDay(next);
}

/**
 * Fechas de ocurrencia en [startDate, throughDate] según la cadencia
 * (Scenario "Generate rituals from cadence"). Incluye `startDate` como
 * primera ocurrencia.
 */
export function generateOccurrenceDates(input: {
  startDate: Date;
  cadence: RitualCadence;
  throughDate: Date;
}): Date[] {
  const through = startOfDay(input.throughDate);
  const dates: Date[] = [];
  let date = startOfDay(input.startDate);
  while (date.getTime() <= through.getTime()) {
    dates.push(date);
    date = addCadence(date, input.cadence);
  }
  return dates;
}

/** Días entre dos fechas de calendario (redondeo por medianoche UTC-safe). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}
