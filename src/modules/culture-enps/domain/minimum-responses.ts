import { DomainError } from "../../../shared/errors";

export const DEFAULT_MINIMUM_RESPONSES = 4;
export const MAXIMUM_MINIMUM_RESPONSES = 100;

export function parseMinimumResponses(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < DEFAULT_MINIMUM_RESPONSES ||
    value > MAXIMUM_MINIMUM_RESPONSES
  ) {
    throw new DomainError(
      "culture-enps/invalid-minimum-responses",
      "Minimum responses must be an integer from 4 to 100",
    );
  }
  return value;
}
