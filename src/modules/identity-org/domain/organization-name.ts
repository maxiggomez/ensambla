import { DomainError } from "../../../shared/errors";

/** Validated organization name (ORG-1): non-empty after trimming. */
export function organizationName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new DomainError("identity-org/invalid-name", "Organization name must not be empty");
  }
  return trimmed;
}
