import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getStrategy } from "../../strategy-northstar/application";
import { getProjectContext } from "../../teams-staffing/application";
import { parseFeedback, type FeedbackClassification } from "../domain/feedback";
import { findFeedbackRequestById, insertFeedback } from "../infrastructure/feedback-repo";

import { actorFromMembers, feedbackMembers, memberById } from "./member-context";

export interface GiveFeedbackInput {
  actorClerkUserId: string;
  recipientMemberId: string;
  body: string;
  classification: unknown;
  projectId?: string | null;
  value?: string | null;
  requestId?: string | null;
}

function columnClassification(value: FeedbackClassification): "Strength" | "Improvement" {
  return value === "strength" ? "Strength" : "Improvement";
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function giveFeedback(
  input: GiveFeedbackInput,
  client: PrismaClient = prismaClient(),
): Promise<{ feedbackId: string }> {
  const members = await feedbackMembers(input.actorClerkUserId, client);
  const author = actorFromMembers(members, input.actorClerkUserId);
  const recipient = memberById(members, input.recipientMemberId);
  const feedback = parseFeedback({
    authorId: author.id,
    recipientId: recipient.id,
    body: input.body,
    classification: input.classification,
  });
  const projectId = input.projectId?.trim() || null;
  if (projectId) {
    await getProjectContext({ actorClerkUserId: input.actorClerkUserId, projectId }, client);
  }
  const value = input.value?.trim() || null;
  if (value) {
    const strategy = await getStrategy({ actorClerkUserId: input.actorClerkUserId }, client);
    if (!strategy.values.includes(value)) {
      throw new ApplicationError("feedback-growth/value-not-found", "Value not found");
    }
  }

  try {
    return await withTenantForUser(
      input.actorClerkUserId,
      async (tx) => {
        const actor = await requireActor(tx, input.actorClerkUserId);
        const requestId = input.requestId?.trim() || null;
        if (requestId) {
          const request = await findFeedbackRequestById(tx, requestId);
          if (
            !request ||
            request.feedback ||
            request.requestedFromId !== actor.id ||
            request.requesterId !== recipient.id
          ) {
            throw new ApplicationError(
              "feedback-growth/request-not-pending",
              "FeedbackRequest is not pending for these Members",
            );
          }
        }
        const feedbackId = randomUUID();
        await insertFeedback(tx, {
          id: feedbackId,
          organizationId: actor.organizationId,
          authorId: feedback.authorId,
          recipientId: feedback.recipientId,
          body: feedback.body,
          classification: columnClassification(feedback.classification),
          projectId,
          value,
          requestId,
        });
        return { feedbackId };
      },
      client,
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApplicationError(
        "feedback-growth/request-not-pending",
        "FeedbackRequest was already fulfilled",
      );
    }
    throw error;
  }
}
