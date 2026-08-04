import { DomainError } from "../../../shared/errors";

export const RITUAL_OCCURRENCE_STATUSES = ["Scheduled", "Held", "Overdue"] as const;
export type RitualOccurrenceStatus = (typeof RITUAL_OCCURRENCE_STATUSES)[number];

export function ritualOccurrenceStatus(value: string): RitualOccurrenceStatus {
  if (!RITUAL_OCCURRENCE_STATUSES.includes(value as RitualOccurrenceStatus)) {
    throw new DomainError(
      "rituals/invalid-occurrence-status",
      `Status must be one of ${RITUAL_OCCURRENCE_STATUSES.join(", ")}`,
    );
  }
  return value as RitualOccurrenceStatus;
}

/**
 * Evalúa una ocurrencia (Scenarios "Overdue ritual" / "Hold a ritual"): una
 * ocurrencia celebrada se conserva como `Held`; una programada cuya fecha ya
 * pasó se marca `Overdue`; las futuras quedan `Scheduled`.
 */
export function evaluateRitualOccurrence(input: {
  status: RitualOccurrenceStatus;
  scheduledDate: Date;
  now: Date;
}): RitualOccurrenceStatus {
  if (input.status === "Held") {
    return "Held";
  }
  if (input.scheduledDate.getTime() < input.now.getTime()) {
    return "Overdue";
  }
  return "Scheduled";
}

/** Marca una ocurrencia como celebrada. */
export function holdRitualOccurrence(): RitualOccurrenceStatus {
  return "Held";
}
