import { DomainError } from "../../../shared/errors";

export function skillName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("skills-matrix/invalid-name", "Skill name must not be empty");
  }
  return trimmed;
}
