import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { toObjectiveView, type ObjectiveView } from "./objective-view";

export async function listObjectiveHistory(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<ObjectiveView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const objectives = await tx.objective.findMany({
        where: { status: { in: ["Closed", "Archived"] } },
        include: { keyResults: true, pillarLinks: true },
        orderBy: { createdAt: "desc" },
      });
      return objectives.map(toObjectiveView);
    },
    client,
  );
}
