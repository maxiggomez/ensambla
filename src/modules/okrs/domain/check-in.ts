import { DomainError } from "../../../shared/errors";
import { textStateSchema } from "../../../shared/measurement";

import { toMeasurement, type KeyResultValues } from "./key-result";

export const MAX_EVIDENCE_FILE_BYTES = 5 * 1024 * 1024;

export type CheckInEvidenceInput =
  | { kind: "link"; url: string }
  | { kind: "file"; fileName: string; mediaType: string; bytes: Uint8Array };

export function validateConfidence(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new DomainError(
      "okrs/invalid-confidence",
      "Check-in confidence must be an integer from 0 through 10",
    );
  }
  return value;
}

export function applyCheckInValue(values: KeyResultValues, value: unknown): KeyResultValues {
  let updated: KeyResultValues;
  switch (values.measurementType) {
    case "check":
      if (typeof value !== "boolean") throw mismatch("check", "boolean");
      updated = { ...values, checkDone: value };
      break;
    case "text": {
      const state = textStateSchema.safeParse(value);
      if (!state.success) throw mismatch("text", "text state");
      updated = { ...values, textState: state.data };
      break;
    }
    case "percentage":
    case "integer":
    case "currency":
      if (typeof value !== "number") throw mismatch(values.measurementType, "number");
      updated = { ...values, currentValue: value };
      break;
  }
  toMeasurement(updated);
  return updated;
}

export function isAtRisk(
  checkIns: readonly { confidence: number; createdAt: Date }[],
): boolean {
  const latest = checkIns.reduce<(typeof checkIns)[number] | null>(
    (current, candidate) =>
      current === null || candidate.createdAt.getTime() > current.createdAt.getTime()
        ? candidate
        : current,
    null,
  );
  return latest !== null && latest.confidence < 5;
}

export function validateEvidence<T extends CheckInEvidenceInput>(evidence: T): T {
  if (evidence.kind === "link") {
    try {
      if (new URL(evidence.url).protocol !== "https:") throw new Error("not HTTPS");
    } catch {
      throw new DomainError("okrs/invalid-evidence", "Evidence links must be valid HTTPS URLs");
    }
    return evidence;
  }

  if (evidence.fileName.trim() === "" || evidence.mediaType.trim() === "") {
    throw new DomainError(
      "okrs/invalid-evidence",
      "File evidence requires a filename and media type",
    );
  }
  if (evidence.bytes.byteLength > MAX_EVIDENCE_FILE_BYTES) {
    throw new DomainError("okrs/evidence-too-large", "File evidence must not exceed 5 MiB");
  }
  return evidence;
}

function mismatch(kind: string, expected: string): DomainError {
  return new DomainError(
    "okrs/value-type-mismatch",
    `A ${kind} key result expects a ${expected} value`,
  );
}
