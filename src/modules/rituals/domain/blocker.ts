import { DomainError } from "../../../shared/errors";

export const BLOCKER_STATUSES = ["Open", "Resolved"] as const;
export type BlockerStatus = (typeof BLOCKER_STATUSES)[number];

export function blockerTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError("rituals/invalid-blocker-title", "Blocker title must not be empty");
  }
  return trimmed;
}

export function blockerDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

export function blockerStatus(value: string): BlockerStatus {
  if (!BLOCKER_STATUSES.includes(value as BlockerStatus)) {
    throw new DomainError(
      "rituals/invalid-blocker-status",
      `Status must be one of ${BLOCKER_STATUSES.join(", ")}`,
    );
  }
  return value as BlockerStatus;
}

/** Un bloqueo se registra siempre abierto (Scenario "Record a blocker"). */
export function openBlockerStatus(): BlockerStatus {
  return "Open";
}

/** Resuelve un bloqueo abierto (Scenario "Resolve a blocker"). */
export function resolveBlocker(input: { status: BlockerStatus; now: Date }): {
  status: "Resolved";
  resolvedAt: Date;
} {
  if (input.status === "Resolved") {
    throw new DomainError("rituals/blocker-already-resolved", "Blocker is already resolved");
  }
  return { status: "Resolved", resolvedAt: input.now };
}
