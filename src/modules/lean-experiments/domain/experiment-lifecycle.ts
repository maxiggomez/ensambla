import { DomainError } from "../../../shared/errors";
import { measurementSchema, type Measurement } from "../../../shared/measurement";

export const EXPERIMENT_STATUSES = ["Hypothesis", "Building", "Measuring", "Learned"] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

const NEXT_STATUS: Partial<Record<ExperimentStatus, ExperimentStatus>> = {
  Hypothesis: "Building",
  Building: "Measuring",
  Measuring: "Learned",
};

export interface ExperimentTransition {
  from: ExperimentStatus;
  to: ExperimentStatus;
  measurement?: unknown;
  cutoffAt?: Date;
  hasLearning?: boolean;
}

export function assertExperimentTransition(input: ExperimentTransition): void {
  if (NEXT_STATUS[input.from] !== input.to) {
    throw new DomainError(
      "lean-experiments/invalid-transition",
      `Cannot transition an experiment from ${input.from} to ${input.to}`,
    );
  }
  if (input.to === "Measuring") {
    const parsed = measurementSchema.safeParse(input.measurement);
    if (!parsed.success) {
      throw new DomainError(
        input.measurement === undefined
          ? "lean-experiments/measurement-required"
          : "lean-experiments/invalid-measurement",
        "A valid Measurement is required before Measuring",
      );
    }
    if (!(input.cutoffAt instanceof Date) || !Number.isFinite(input.cutoffAt.getTime())) {
      throw new DomainError(
        "lean-experiments/cutoff-required",
        "A valid cutoff date is required before Measuring",
      );
    }
  }
  if (input.to === "Learned" && !input.hasLearning) {
    throw new DomainError(
      "lean-experiments/learning-required",
      "A structured learning is required before Learned",
    );
  }
}

export function parseExperimentMeasurement(value: unknown): Measurement {
  const parsed = measurementSchema.safeParse(value);
  if (!parsed.success) {
    throw new DomainError("lean-experiments/invalid-measurement", "Invalid experiment metric");
  }
  return parsed.data;
}
