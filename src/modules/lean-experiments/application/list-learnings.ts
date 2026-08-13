import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listKeyResultContexts } from "../../okrs/application";
import type { LearningDecision } from "../domain/learning";
import { listExperimentAggregates } from "../infrastructure/experiment-repo";

export interface LearningView {
  experimentId: string;
  believed: string;
  tested: string;
  learned: string;
  decision: LearningDecision;
  keyResultId: string;
  keyResultTitle: string;
  objectiveId: string;
  objectiveTitle: string;
  createdAt: Date;
}

export async function listLearnings(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<LearningView[]> {
  const rows = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return (await listExperimentAggregates(tx)).filter(
        (row): row is typeof row & { learning: NonNullable<typeof row.learning> } =>
          row.learning !== null,
      );
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
  return rows.flatMap((row) => {
    const context = contextById.get(row.hypothesis.keyResultId);
    if (!context) return [];
    return [
      {
        experimentId: row.id,
        believed: row.learning.believed,
        tested: row.learning.tested,
        learned: row.learning.learned,
        decision: row.learning.decision === "Persevere" ? "persevere" : "pivot",
        keyResultId: context.keyResultId,
        keyResultTitle: context.keyResultTitle,
        objectiveId: context.objectiveId,
        objectiveTitle: context.objectiveTitle,
        createdAt: row.learning.createdAt,
      },
    ];
  });
}
