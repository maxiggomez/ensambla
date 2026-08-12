import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { isAtRisk } from "../domain/check-in";
import { listKeyResultsWithLatestCheckIn } from "../infrastructure/check-in-repo";

export interface AtRiskKeyResultView {
  keyResultId: string;
  keyResultTitle: string;
  objectiveId: string;
  objectiveTitle: string;
  confidence: number;
}

export async function listAtRiskKeyResults(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<AtRiskKeyResultView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError(
          "okrs/forbidden",
          "Only Dirección can list at-risk key results",
        );
      }
      const keyResults = await listKeyResultsWithLatestCheckIn(tx);
      return keyResults.flatMap((keyResult) => {
        const latest = keyResult.checkIns[0];
        if (!latest || !isAtRisk([latest])) return [];
        return [
          {
            keyResultId: keyResult.id,
            keyResultTitle: keyResult.title,
            objectiveId: keyResult.objective.id,
            objectiveTitle: keyResult.objective.title,
            confidence: latest.confidence,
          },
        ];
      });
    },
    client,
  );
}
