import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { parseFeedbackRequest } from "../domain/feedback";
import { insertFeedbackRequest } from "../infrastructure/feedback-repo";

import { actorFromMembers, feedbackMembers, memberById } from "./member-context";

export interface RequestFeedbackInput {
  actorClerkUserId: string;
  requestedFromMemberId: string;
  prompt: string;
}

export async function requestFeedback(
  input: RequestFeedbackInput,
  client: PrismaClient = prismaClient(),
): Promise<{ requestId: string }> {
  const members = await feedbackMembers(input.actorClerkUserId, client);
  const requester = actorFromMembers(members, input.actorClerkUserId);
  const requestedFrom = memberById(members, input.requestedFromMemberId);
  const request = parseFeedbackRequest({
    requesterId: requester.id,
    requestedFromId: requestedFrom.id,
    prompt: input.prompt,
  });

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const requestId = randomUUID();
      await insertFeedbackRequest(tx, {
        id: requestId,
        organizationId: actor.organizationId,
        ...request,
      });
      return { requestId };
    },
    client,
  );
}
