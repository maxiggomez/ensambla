import { DomainError } from "../../../shared/errors";

import type { ObjectiveLevel } from "./objective";

export function validateObjectiveScope(
  level: ObjectiveLevel,
  teamId: string | null,
): { teamId: string | null } {
  if (level === "Team" && teamId === null) {
    throw new DomainError("okrs/team-required", "A Team-level objective requires a Team");
  }
  if (level !== "Team" && teamId !== null) {
    throw new DomainError(
      "okrs/team-not-allowed",
      "Only a Team-level objective can reference a Team",
    );
  }
  return { teamId };
}

export function isOrphan(input: {
  parentObjectiveId: string | null;
  pillarIds: readonly string[];
}): boolean {
  return input.parentObjectiveId === null && input.pillarIds.length === 0;
}

export function assertAcyclicAlignment(
  objectiveId: string,
  parentObjectiveId: string,
  parentAncestorIds: readonly string[],
): void {
  if (objectiveId === parentObjectiveId || parentAncestorIds.includes(objectiveId)) {
    throw new DomainError(
      "okrs/alignment-cycle",
      "An objective cannot be aligned to itself or one of its descendants",
    );
  }
}
