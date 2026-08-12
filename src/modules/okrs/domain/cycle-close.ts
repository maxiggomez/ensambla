import { DomainError } from "../../../shared/errors";

import type { ObjectiveStatus } from "./objective";

export const KEY_RESULT_GRADES = ["Achieved", "Partial", "NotAchieved"] as const;
export type KeyResultGrade = (typeof KEY_RESULT_GRADES)[number];

export function validateCycleDates(
  startsAt: Date,
  endsAt: Date,
): {
  startsAt: Date;
  endsAt: Date;
} {
  if (
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime()) ||
    endsAt.getTime() <= startsAt.getTime()
  ) {
    throw new DomainError("okrs/invalid-cycle-dates", "An OKR cycle must end after it starts");
  }
  return { startsAt, endsAt };
}

export function assertAllKeyResultsGraded(grades: readonly (KeyResultGrade | null)[]): void {
  if (grades.some((grade) => grade === null)) {
    throw new DomainError(
      "okrs/ungraded-key-results",
      "Every key result must be graded before closing an objective",
    );
  }
}

export function assertStatusTransition(from: ObjectiveStatus, to: ObjectiveStatus): void {
  const valid =
    (from === "Published" && to === "Closed") || (from === "Closed" && to === "Archived");
  if (!valid) {
    throw new DomainError(
      "okrs/invalid-status-transition",
      `Objective cannot transition from ${from} to ${to}`,
    );
  }
}

export function assertMutableObjective(status: ObjectiveStatus): void {
  if (status === "Archived") {
    throw new DomainError("okrs/objective-read-only", "Archived objectives are read-only");
  }
}
