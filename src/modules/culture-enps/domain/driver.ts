import { DomainError } from "../../../shared/errors";

export const DRIVERS = [
  "Recognition",
  "GoalClarity",
  "CareerGrowth",
  "Workload",
  "Coordination",
  "Other",
] as const;

export type Driver = (typeof DRIVERS)[number];

export function parseDriver(value: string): Driver {
  if (!(DRIVERS as readonly string[]).includes(value)) {
    throw new DomainError("culture-enps/invalid-driver", "Invalid response driver");
  }
  return value as Driver;
}
