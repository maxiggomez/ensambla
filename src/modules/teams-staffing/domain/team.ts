import { DomainError } from "../../../shared/errors";

export function teamName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("teams-staffing/invalid-name", "Team name must not be empty");
  }
  return trimmed;
}

export function teamDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}
