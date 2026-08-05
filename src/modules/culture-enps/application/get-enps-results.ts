import { requireActor } from "../../identity-org/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { groupCommentsByDriver, type DriverGroup } from "../domain/drivers";
import { calculateEnps, type EnpsResult, type VisibleEnpsResult } from "../domain/enps";
import type { PulseScope } from "../domain/pulse";
import { getAggregateInputs } from "../infrastructure/results-repo";

export type EnpsResultsView = {
  pulseId: string;
  scope: PulseScope;
  result:
    Exclude<EnpsResult, VisibleEnpsResult> | (VisibleEnpsResult & { drivers: DriverGroup[] });
};

export async function getEnpsResults(
  input: { actorClerkUserId: string; pulseId: string },
  client: PrismaClient = prismaClient(),
): Promise<EnpsResultsView> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const aggregate = await getAggregateInputs(tx, input.pulseId);
      const result = calculateEnps({
        ratings: aggregate.responses.map((response) => response.rating),
        recipientCount: aggregate.recipientCount,
        minimumResponses: aggregate.minimumResponses,
      });
      return {
        pulseId: aggregate.pulseId,
        scope: aggregate.scope,
        result:
          result.status === "suppressed"
            ? result
            : { ...result, drivers: groupCommentsByDriver(aggregate.responses) },
      };
    },
    client,
  );
}
