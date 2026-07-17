import { DomainError } from "../../../shared/errors";

/** Validated member display name (F.5): non-empty after trimming. */
export function memberName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new DomainError("identity-org/invalid-member-name", "Member name must not be empty");
  }
  return trimmed;
}
