import { z } from "zod";

/**
 * `Measurement` (ADR-0004): closed discriminated union for user-defined
 * measurable values. Shared by `okrs`, `strategy-northstar` and
 * `lean-experiments` — adding a type means touching only this file.
 *
 * Persistence maps to explicit queryable columns (`measurement_type`,
 * `start_value`, `target_value`, `current_value`, `text_state`); never EAV.
 */

const percentageValue = z.number().min(0).max(100);
const integerValue = z.number().int();
// Zod rejects NaN/Infinity for z.number() by default; keep currency unrestricted
// beyond that (negative amounts are valid, e.g. reducing a cost below zero).
const currencyValue = z.number();

export const textStateSchema = z.enum(["not_started", "in_progress", "done"]);
export type TextState = z.infer<typeof textStateSchema>;

export const measurementSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("check"), done: z.boolean() }),
  z.object({
    type: z.literal("percentage"),
    start: percentageValue,
    target: percentageValue,
    current: percentageValue,
  }),
  z.object({
    type: z.literal("integer"),
    start: integerValue,
    target: integerValue,
    current: integerValue,
  }),
  z.object({
    type: z.literal("currency"),
    start: currencyValue,
    target: currencyValue,
    current: currencyValue,
  }),
  z.object({ type: z.literal("text"), state: textStateSchema }),
]);

export type Measurement = z.infer<typeof measurementSchema>;

type NumericMeasurement = Extract<Measurement, { type: "percentage" | "integer" | "currency" }>;

/**
 * Polymorphic progress in percent, always within [0, 100].
 *
 * - `check`: 0 or 100.
 * - `percentage` / `integer` / `currency`: `(current − start) / (target − start)`,
 *   clamped to [0, 100]; works for decreasing targets too. If `start === target`
 *   there is nothing to advance: 100 when `current` equals the target, else 0.
 * - `text`: no numeric value of its own; for roll-up (🔒 ADR-0004) it contributes
 *   100 only when `done`, otherwise 0.
 */
export function progress(measurement: Measurement): number {
  switch (measurement.type) {
    case "check":
      return measurement.done ? 100 : 0;
    case "text":
      return measurement.state === "done" ? 100 : 0;
    case "percentage":
    case "integer":
    case "currency":
      return numericProgress(measurement);
  }
}

function numericProgress({ start, target, current }: NumericMeasurement): number {
  if (start === target) {
    return current === target ? 100 : 0;
  }
  const ratio = (current - start) / (target - start);
  return Math.min(100, Math.max(0, ratio * 100));
}
