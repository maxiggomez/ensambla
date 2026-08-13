import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { measurementToColumns, type Measurement } from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getKeyResultContext } from "../../okrs/application";
import { assertExperimentTransition } from "../domain/experiment-lifecycle";
import {
  compareAndSetExperimentStatus,
  findExperimentAggregate,
} from "../infrastructure/experiment-repo";

interface TransitionIdentity {
  actorClerkUserId: string;
  experimentId: string;
}

async function transition(
  input: TransitionIdentity & {
    to: "Building" | "Measuring";
    measurement?: unknown;
    cutoffAt?: Date;
  },
  client: PrismaClient,
): Promise<void> {
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
  assertExperimentTransition({
    from: snapshot.status,
    to: input.to,
    measurement: input.measurement,
    cutoffAt: input.cutoffAt,
  });
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const changed = await compareAndSetExperimentStatus(tx, {
        id: input.experimentId,
        from: snapshot.status,
        to: input.to,
        measurement:
          input.to === "Measuring"
            ? measurementToColumns(input.measurement as Measurement)
            : undefined,
        cutoffAt: input.cutoffAt,
      });
      if (!changed) {
        throw new ApplicationError(
          "lean-experiments/stale-transition",
          "Experiment state changed concurrently",
        );
      }
    },
    client,
  );
}

export function startBuilding(
  input: TransitionIdentity,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  return transition({ ...input, to: "Building" }, client);
}

export interface StartMeasuringInput extends TransitionIdentity {
  measurement: unknown;
  cutoffAt: Date;
}

export function startMeasuring(
  input: StartMeasuringInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  return transition({ ...input, to: "Measuring" }, client);
}
