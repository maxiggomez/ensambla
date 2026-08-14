import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getProjectContext, type ProjectContextView } from "../../teams-staffing/application";
import { listFeedbackForParticipant } from "../infrastructure/feedback-repo";

import { actorFromMembers, feedbackMembers } from "./member-context";

export interface PrivateFeedbackView {
  feedbackId: string;
  authorId: string;
  authorName: string;
  recipientId: string;
  recipientName: string;
  body: string;
  classification: "strength" | "improvement";
  project: ProjectContextView | null;
  value: string | null;
  requestId: string | null;
  createdAt: Date;
}

export async function listPrivateFeedback(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<PrivateFeedbackView[]> {
  const members = await feedbackMembers(input.actorClerkUserId, client);
  const actor = actorFromMembers(members, input.actorClerkUserId);
  const rows = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listFeedbackForParticipant(tx, actor.id);
    },
    client,
  );
  const names = new Map(members.map((member) => [member.id, member.name]));
  const projectContexts = new Map<string, ProjectContextView>();
  for (const projectId of new Set(
    rows.flatMap((row) => (row.projectId ? [row.projectId] : [])),
  )) {
    projectContexts.set(
      projectId,
      await getProjectContext({ actorClerkUserId: input.actorClerkUserId, projectId }, client),
    );
  }
  return rows.map((row) => ({
    feedbackId: row.id,
    authorId: row.authorId,
    authorName: names.get(row.authorId) ?? "Member",
    recipientId: row.recipientId,
    recipientName: names.get(row.recipientId) ?? "Member",
    body: row.body,
    classification: row.classification === "Strength" ? "strength" : "improvement",
    project: row.projectId ? (projectContexts.get(row.projectId) ?? null) : null,
    value: row.value,
    requestId: row.requestId,
    createdAt: row.createdAt,
  }));
}
