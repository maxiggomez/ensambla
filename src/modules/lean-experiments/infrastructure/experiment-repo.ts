import type {
  Experiment,
  ExperimentStatus,
  Hypothesis,
  Learning,
  TenantClient,
} from "../../../shared/db";
import type { MeasurementColumns } from "../../../shared/measurement";
import type { ParsedLearning } from "../domain/learning";

export type ExperimentAggregateRow = Experiment & {
  hypothesis: Hypothesis;
  learning: Learning | null;
};

export interface InsertExperimentInput {
  experimentId: string;
  hypothesisId: string;
  organizationId: string;
  keyResultId: string;
  objectiveId: string;
  belief: string;
  expectedOutcome: string;
}

export async function insertExperimentAggregate(
  tx: TenantClient,
  input: InsertExperimentInput,
): Promise<void> {
  await tx.hypothesis.create({
    data: {
      id: input.hypothesisId,
      organizationId: input.organizationId,
      keyResultId: input.keyResultId,
      objectiveId: input.objectiveId,
      belief: input.belief,
      expectedOutcome: input.expectedOutcome,
    },
  });
  await tx.experiment.create({
    data: {
      id: input.experimentId,
      organizationId: input.organizationId,
      hypothesisId: input.hypothesisId,
    },
  });
}

export function listExperimentAggregates(tx: TenantClient): Promise<ExperimentAggregateRow[]> {
  return tx.experiment.findMany({
    include: { hypothesis: true, learning: true },
    orderBy: { createdAt: "asc" },
  });
}

export function findExperimentAggregate(
  tx: TenantClient,
  id: string,
): Promise<ExperimentAggregateRow | null> {
  return tx.experiment.findUnique({
    where: { id },
    include: { hypothesis: true, learning: true },
  });
}

export async function compareAndSetExperimentStatus(
  tx: TenantClient,
  input: {
    id: string;
    from: ExperimentStatus;
    to: ExperimentStatus;
    measurement?: MeasurementColumns;
    cutoffAt?: Date;
  },
): Promise<boolean> {
  const result = await tx.experiment.updateMany({
    where: { id: input.id, status: input.from },
    data: {
      status: input.to,
      measurementType: input.measurement?.measurementType,
      startValue: input.measurement?.startValue,
      targetValue: input.measurement?.targetValue,
      currentValue: input.measurement?.currentValue,
      checkDone: input.measurement?.checkDone,
      textState: input.measurement?.textState,
      cutoffAt: input.cutoffAt,
    },
  });
  return result.count === 1;
}

export async function insertLearning(
  tx: TenantClient,
  input: ParsedLearning & {
    id: string;
    organizationId: string;
    experimentId: string;
  },
): Promise<void> {
  await tx.learning.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      experimentId: input.experimentId,
      believed: input.believed,
      tested: input.tested,
      learned: input.learned,
      decision: input.decision === "persevere" ? "Persevere" : "Pivot",
    },
  });
}
