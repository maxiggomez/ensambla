import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getStrategicMap } from "../../strategy-northstar/application";
import { findAlignmentKeyResult, readObjectiveChain } from "../infrastructure/alignment-repo";

export interface AlignmentChainView {
  keyResult: { id: string; title: string };
  objectives: { id: string; title: string }[];
  pillar: { id: string; name: string } | null;
  northStarName: string | null;
}

export async function getAlignmentChain(
  input: { actorClerkUserId: string; keyResultId: string },
  client: PrismaClient = prismaClient(),
): Promise<AlignmentChainView> {
  const local = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const keyResult = await findAlignmentKeyResult(tx, input.keyResultId);
      if (!keyResult) {
        throw new ApplicationError("okrs/key-result-not-found", "Key result not found");
      }
      return {
        keyResult: { id: keyResult.id, title: keyResult.title },
        objectives: await readObjectiveChain(tx, keyResult.objectiveId),
      };
    },
    client,
  );
  const strategicMap = await getStrategicMap(
    { actorClerkUserId: input.actorClerkUserId },
    client,
  );
  const objectiveIds = new Set(local.objectives.map((objective) => objective.id));
  const pillar = strategicMap.pillars.find((item) =>
    item.objectives.some((objective) => objectiveIds.has(objective.id)),
  );
  return {
    keyResult: local.keyResult,
    objectives: local.objectives.map(({ id, title }) => ({ id, title })),
    pillar: pillar ? { id: pillar.id, name: pillar.name } : null,
    northStarName: strategicMap.northStar?.name ?? null,
  };
}
