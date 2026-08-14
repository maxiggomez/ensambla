import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listFeedbackRequestsForParticipant } from "../infrastructure/feedback-repo";

import { actorFromMembers, feedbackMembers } from "./member-context";

export interface FeedbackRequestView {
  requestId: string;
  requesterId: string;
  requesterName: string;
  requestedFromId: string;
  requestedFromName: string;
  prompt: string;
  pending: boolean;
  feedbackId: string | null;
  createdAt: Date;
}

export interface FeedbackRequestsView {
  inbox: FeedbackRequestView[];
  outbox: FeedbackRequestView[];
}

export async function listFeedbackRequests(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<FeedbackRequestsView> {
  const members = await feedbackMembers(input.actorClerkUserId, client);
  const actor = actorFromMembers(members, input.actorClerkUserId);
  const rows = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listFeedbackRequestsForParticipant(tx, actor.id);
    },
    client,
  );
  const names = new Map(members.map((member) => [member.id, member.name]));
  const views = rows.map((row) => ({
    requestId: row.id,
    requesterId: row.requesterId,
    requesterName: names.get(row.requesterId) ?? "Member",
    requestedFromId: row.requestedFromId,
    requestedFromName: names.get(row.requestedFromId) ?? "Member",
    prompt: row.prompt,
    pending: row.feedback === null,
    feedbackId: row.feedback?.id ?? null,
    createdAt: row.createdAt,
  }));
  return {
    inbox: views.filter((view) => view.requestedFromId === actor.id),
    outbox: views.filter((view) => view.requesterId === actor.id),
  };
}
