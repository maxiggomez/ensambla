import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getKeyResultContext } from "../../okrs/application";
import { assertExperimentTransition } from "../domain/experiment-lifecycle";
import { parseLearning, type LearningInput } from "../domain/learning";
import {
  compareAndSetExperimentStatus,
  findExperimentAggregate,
  insertLearning,
} from "../infrastructure/experiment-repo";

export interface CloseExperimentInput extends LearningInput {
  actorClerkUserId: string;
  experimentId: string;
}

export async function closeExperiment(
  input: CloseExperimentInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const learning = parseLearning(input);
  const snapshot = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const experiment = await findExperimentAggregate(tx, input.experimentId);
      if (!experiment) {
        throw new ApplicationError(
          "lean-experiments/experiment-not-found",
          "Experiment not found",
        );
      }
      return { status: experiment.status, keyResultId: experiment.hypothesis.keyResultId };
    },
    client,
  );
  await getKeyResultContext(
    { actorClerkUserId: input.actorClerkUserId, keyResultId: snapshot.keyResultId },
    client,
  );
  assertExperimentTransition({ from: snapshot.status, to: "Learned", hasLearning: true });
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const changed = await compareAndSetExperimentStatus(tx, {
        id: input.experimentId,
        from: snapshot.status,
        to: "Learned",
      });
      if (!changed) {
        throw new ApplicationError(
          "lean-experiments/stale-transition",
          "Experiment state changed concurrently",
        );
      }
      await insertLearning(tx, {
        id: randomUUID(),
        organizationId: actor.organizationId,
        experimentId: input.experimentId,
        ...learning,
      });
    },
    client,
  );
}
