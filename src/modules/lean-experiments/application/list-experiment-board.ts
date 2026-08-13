import {
  prismaClient,
  type ExperimentStatus as DbStatus,
  type PrismaClient,
} from "../../../shared/db";
import { measurementFromColumns, type Measurement } from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listKeyResultContexts } from "../../okrs/application";
import type { ExperimentStatus } from "../domain/experiment-lifecycle";
import { listExperimentAggregates } from "../infrastructure/experiment-repo";

export interface ExperimentCardView {
  experimentId: string;
  status: ExperimentStatus;
  statement: string;
  keyResultId: string;
  keyResultTitle: string;
  objectiveId: string;
  objectiveTitle: string;
  cutoffAt: Date | null;
  measurement: Measurement | null;
}

export type ExperimentBoardView = Record<ExperimentStatus, ExperimentCardView[]>;

function domainStatus(status: DbStatus): ExperimentStatus {
  return status;
}

export async function listExperimentBoard(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<ExperimentBoardView> {
  const rows = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listExperimentAggregates(tx);
    },
    client,
  );
  const contexts = await listKeyResultContexts(
    {
      actorClerkUserId: input.actorClerkUserId,
      keyResultIds: rows.map((row) => row.hypothesis.keyResultId),
    },
    client,
  );
  const contextById = new Map(contexts.map((context) => [context.keyResultId, context]));
  const board: ExperimentBoardView = {
    Hypothesis: [],
    Building: [],
    Measuring: [],
    Learned: [],
  };
  for (const row of rows) {
    const context = contextById.get(row.hypothesis.keyResultId);
    if (!context) continue;
    const status = domainStatus(row.status);
    board[status].push({
      experimentId: row.id,
      status,
      statement: `We believe ${row.hypothesis.belief} → we expect ${row.hypothesis.expectedOutcome}`,
      keyResultId: context.keyResultId,
      keyResultTitle: context.keyResultTitle,
      objectiveId: context.objectiveId,
      objectiveTitle: context.objectiveTitle,
      cutoffAt: row.cutoffAt,
      measurement:
        row.measurementType === null
          ? null
          : measurementFromColumns({
              measurementType: row.measurementType,
              startValue: row.startValue === null ? null : Number(row.startValue),
              targetValue: row.targetValue === null ? null : Number(row.targetValue),
              currentValue: row.currentValue === null ? null : Number(row.currentValue),
              checkDone: row.checkDone,
              textState: row.textState,
            }),
    });
  }
  return board;
}
