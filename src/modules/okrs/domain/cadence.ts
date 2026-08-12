export const CHECK_IN_CADENCES = ["Weekly", "Biweekly", "Monthly"] as const;
export type CheckInCadence = (typeof CHECK_IN_CADENCES)[number];

export function effectiveCadence(
  objectiveCadence: CheckInCadence | null,
  teamCadence: CheckInCadence | null,
): CheckInCadence | null {
  return objectiveCadence ?? teamCadence;
}

export function nextDueAt(baselineAt: Date, cadence: CheckInCadence): Date {
  switch (cadence) {
    case "Weekly":
      return addUtcDays(baselineAt, 7);
    case "Biweekly":
      return addUtcDays(baselineAt, 14);
    case "Monthly":
      return addUtcMonthClamped(baselineAt);
  }
}

export function isCheckInDue(input: {
  cadence: CheckInCadence | null;
  baselineAt: Date;
  now: Date;
}): boolean {
  return input.cadence === null
    ? false
    : input.now.getTime() >= nextDueAt(input.baselineAt, input.cadence).getTime();
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addUtcMonthClamped(value: Date): Date {
  const result = new Date(value);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}
