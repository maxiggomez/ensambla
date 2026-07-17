import { DomainError } from "../../../shared/errors";
import { measurementSchema, type Measurement } from "../../../shared/measurement";

/** La North Star: nombre + `Measurement` tipado (ADR-0004). Una por Organización. */
export interface NorthStar {
  name: string;
  measurement: Measurement;
}

export function northStar(input: { name: string; measurement: unknown }): NorthStar {
  const name = input.name.trim();
  if (name === "") {
    throw new DomainError(
      "strategy-northstar/invalid-name",
      "North Star name must not be empty",
    );
  }
  const parsed = measurementSchema.safeParse(input.measurement);
  if (!parsed.success) {
    throw new DomainError(
      "strategy-northstar/invalid-measurement",
      "North Star measurement is not a valid typed Measurement",
    );
  }
  return { name, measurement: parsed.data };
}
