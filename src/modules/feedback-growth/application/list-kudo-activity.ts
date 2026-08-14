import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listKudos } from "../infrastructure/kudo-repo";

import { feedbackMembers } from "./member-context";

export type KudoContextView =
  | { type: "Objective"; objectiveId: string; objectiveTitle: string }
  | {
      type: "KeyResult";
      keyResultId: string;
      keyResultTitle: string;
      objectiveId: string;
      objectiveTitle: string;
    };

export interface KudoActivityView {
  kudoId: string;
  giverId: string;
  giverName: string;
  recipientId: string;
  recipientName: string;
  message: string;
  value: string;
  context: KudoContextView | null;
  createdAt: Date;
}

export async function listKudoActivity(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<KudoActivityView[]> {
  const members = await feedbackMembers(input.actorClerkUserId, client);
  const rows = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listKudos(tx);
    },
    client,
  );
  const names = new Map(members.map((member) => [member.id, member.name]));
  return rows.map((row) => ({
    kudoId: row.id,
    giverId: row.giverId,
    giverName: names.get(row.giverId) ?? "Member",
    recipientId: row.recipientId,
    recipientName: names.get(row.recipientId) ?? "Member",
    message: row.message,
    value: row.value,
    context:
      row.objectiveId && row.objectiveTitleSnapshot
        ? {
            type: "Objective",
            objectiveId: row.objectiveId,
            objectiveTitle: row.objectiveTitleSnapshot,
          }
        : row.keyResultId &&
            row.keyResultTitleSnapshot &&
            row.objectiveTitleSnapshot &&
            row.keyResult
          ? {
              type: "KeyResult",
              keyResultId: row.keyResultId,
              keyResultTitle: row.keyResultTitleSnapshot,
              objectiveId: row.keyResult.objectiveId,
              objectiveTitle: row.objectiveTitleSnapshot,
            }
          : null,
    createdAt: row.createdAt,
  }));
}
