export const PULSE_FREQUENCIES = ["weekly", "monthly", "quarterly"] as const;
export type PulseFrequency = (typeof PULSE_FREQUENCIES)[number];

export function nextOccurrence(from: Date, frequency: PulseFrequency): Date {
  const next = new Date(from);
  if (frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  const months = frequency === "monthly" ? 1 : 3;
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}
