import { DomainError } from "../../../shared/errors";

export function projectName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("teams-staffing/invalid-name", "Project name must not be empty");
  }
  return trimmed;
}

export const PROJECT_STATUSES = ["Active", "Closed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function closeProjectStatus(current: ProjectStatus): "Closed" {
  if (current !== "Active") {
    throw new DomainError(
      "teams-staffing/invalid-project-transition",
      "Only an Active Project can be closed",
    );
  }
  return "Closed";
}
