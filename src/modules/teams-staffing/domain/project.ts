import { DomainError } from "../../../shared/errors";

export function projectName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("teams-staffing/invalid-name", "Project name must not be empty");
  }
  return trimmed;
}
