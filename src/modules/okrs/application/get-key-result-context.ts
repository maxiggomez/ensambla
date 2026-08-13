import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { canViewObjective } from "../domain/objective-policy";
import { findKeyResultsWithObjectives } from "../infrastructure/key-result-repo";

export interface KeyResultContextView {
  keyResultId: string;
  keyResultTitle: string;
  objectiveId: string;
  objectiveTitle: string;
}

export interface GetKeyResultContextInput {
  actorClerkUserId: string;
  keyResultId: string;
}

export interface ListKeyResultContextsInput {
  actorClerkUserId: string;
  keyResultIds: readonly string[];
}

export async function listKeyResultContexts(
  input: ListKeyResultContextsInput,
  client: PrismaClient = prismaClient(),
): Promise<KeyResultContextView[]> {
  const uniqueIds = [...new Set(input.keyResultIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const rows = await findKeyResultsWithObjectives(tx, uniqueIds);
      const visibleById = new Map(
        rows
          .filter((row) =>
            canViewObjective(
              actor.role,
              row.objective.ownerId === actor.id,
              row.objective.status,
            ),
          )
          .map((row) => [row.id, row]),
      );
      return uniqueIds.flatMap((id) => {
        const row = visibleById.get(id);
        return row
          ? [
              {
                keyResultId: row.id,
                keyResultTitle: row.title,
                objectiveId: row.objective.id,
                objectiveTitle: row.objective.title,
              },
            ]
          : [];
      });
    },
    client,
  );
}

export async function getKeyResultContext(
  input: GetKeyResultContextInput,
  client: PrismaClient = prismaClient(),
): Promise<KeyResultContextView> {
  const [context] = await listKeyResultContexts(
    { actorClerkUserId: input.actorClerkUserId, keyResultIds: [input.keyResultId] },
    client,
  );
  if (!context) {
    throw new ApplicationError("okrs/key-result-not-found", "KeyResult not found");
  }
  return context;
}
