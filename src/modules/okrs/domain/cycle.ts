import { DomainError } from "../../../shared/errors";

export function cycleName(value: string): string {
  const normalized = value.trim();
  if (normalized === "") {
    throw new DomainError("okrs/invalid-cycle-name", "Cycle name must not be empty");
  }
  return normalized;
}
