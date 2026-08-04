import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { DEFAULT_RETRO_CYCLE_DAYS, evaluateRetroRisk } from "../domain/retrospective-risk";
import { listRetrosForTeams } from "../infrastructure/retro-repo";

export interface LearningRiskView {
  teamId: string;
  atRisk: boolean;
}

/**
 * Riesgo de aprendizaje DERIVADO por Team (Scenario "Missing retrospective"):
 * se evalúan los Team pedidos contra su última retrospectiva (≥ 2 ciclos sin
 * retro, o nunca, ⇒ riesgo). El flag nunca se persiste.
 */
export async function evaluateLearningRisks(
  input: { actorClerkUserId: string; teamIds: readonly string[] },
  client: PrismaClient = prismaClient(),
): Promise<LearningRiskView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const retros = await listRetrosForTeams(tx, input.teamIds);
      const lastRetroByTeam = new Map<string, Date>();
      for (const retro of retros) {
        const previous = lastRetroByTeam.get(retro.teamId);
        if (previous === undefined || retro.heldAt > previous) {
          lastRetroByTeam.set(retro.teamId, retro.heldAt);
        }
      }
      const now = new Date();
      return input.teamIds.map((teamId) => ({
        teamId,
        atRisk: evaluateRetroRisk({
          lastRetroDate: lastRetroByTeam.get(teamId) ?? null,
          cycleDays: DEFAULT_RETRO_CYCLE_DAYS,
          now,
        }),
      }));
    },
    client,
  );
}
