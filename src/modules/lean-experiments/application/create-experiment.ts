import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getKeyResultContext } from "../../okrs/application";
import { parseHypothesis } from "../domain/hypothesis";
import { insertExperimentAggregate } from "../infrastructure/experiment-repo";

export interface CreateExperimentInput {
  actorClerkUserId: string;
  keyResultId: string;
  belief: string;
  expectedOutcome: string;
}

export async function createExperiment(
  input: CreateExperimentInput,
  client: PrismaClient = prismaClient(),
): Promise<{ experimentId: string }> {
  const hypothesis = parseHypothesis(input);
  const context = await getKeyResultContext(
    { actorClerkUserId: input.actorClerkUserId, keyResultId: input.keyResultId },
    client,
  );
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const experimentId = randomUUID();
      await insertExperimentAggregate(tx, {
        experimentId,
        hypothesisId: randomUUID(),
        organizationId: actor.organizationId,
        keyResultId: context.keyResultId,
        objectiveId: context.objectiveId,
        belief: hypothesis.belief,
        expectedOutcome: hypothesis.expectedOutcome,
      });
      return { experimentId };
    },
    client,
  );
}
