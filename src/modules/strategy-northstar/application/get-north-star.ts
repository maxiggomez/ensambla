import { prismaClient, type PrismaClient } from "../../../shared/db";
import {
  measurementFromColumns,
  progress,
  type Measurement,
} from "../../../shared/measurement";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { findNorthStar } from "../infrastructure/north-star-repo";

export interface GetNorthStarInput {
  actorClerkUserId: string;
}

export interface NorthStarView {
  name: string;
  measurement: Measurement;
  /** Derivado del Measurement (ADR-0004); nunca persistido. */
  progress: number;
}

/** La North Star de la Organización del actor, o null si no fue definida. */
export async function getNorthStar(
  input: GetNorthStarInput,
  client: PrismaClient = prismaClient(),
): Promise<NorthStarView | null> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const row = await findNorthStar(tx, actor.organizationId);
      if (!row) {
        return null;
      }
      const measurement = measurementFromColumns({
        measurementType: row.measurementType,
        startValue: row.startValue === null ? null : Number(row.startValue),
        targetValue: row.targetValue === null ? null : Number(row.targetValue),
        currentValue: row.currentValue === null ? null : Number(row.currentValue),
        checkDone: row.checkDone,
        textState: row.textState,
      });
      return { name: row.name, measurement, progress: progress(measurement) };
    },
    client,
  );
}
