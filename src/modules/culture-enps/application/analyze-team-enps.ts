import { requireActor } from "../../identity-org/application";
import { listTeamCapacities } from "../../teams-staffing/application";
import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { correlateTeamEnps, type EnpsCapacityCorrelation } from "../domain/correlation";
import type { VisibleEnpsResult } from "../domain/enps";
import { listTeamPulseIds } from "../infrastructure/pulse-repo";

import { getEnpsResults } from "./get-enps-results";

export interface AnalyzeTeamEnpsInput {
  actorClerkUserId: string;
  teamId: string;
}

export async function analyzeTeamEnps(
  input: AnalyzeTeamEnpsInput,
  client: PrismaClient = prismaClient(),
): Promise<{ teamId: string; correlations: EnpsCapacityCorrelation[] }> {
  const pulseIds = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listTeamPulseIds(tx, input.teamId);
    },
    client,
  );
  const visibleScores: VisibleEnpsResult["score"][] = [];
  for (const pulseId of pulseIds) {
    const view = await getEnpsResults(
      { actorClerkUserId: input.actorClerkUserId, pulseId },
      client,
    );
    if (view.result.status === "visible") visibleScores.push(view.result.score);
    if (visibleScores.length === 2) break;
  }
  if (visibleScores.length < 2) return { teamId: input.teamId, correlations: [] };

  const capacities = await listTeamCapacities(
    { actorClerkUserId: input.actorClerkUserId },
    client,
  );
  const team = capacities.find((capacity) => capacity.teamId === input.teamId);
  if (!team) {
    throw new ApplicationError("culture-enps/team-not-found", "Team not found");
  }
  return {
    teamId: input.teamId,
    correlations: correlateTeamEnps({
      previous: visibleScores[1]!,
      current: visibleScores[0]!,
      signals: [
        {
          type: "over_capacity",
          capacity: { type: "percentage", start: 0, target: 100, current: team.capacity },
        },
      ],
    }),
  };
}
