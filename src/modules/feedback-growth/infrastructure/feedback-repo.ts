import type { TenantClient } from "../../../shared/db";

export interface InsertFeedbackRequestInput {
  id: string;
  organizationId: string;
  requesterId: string;
  requestedFromId: string;
  prompt: string;
}

export function insertFeedbackRequest(
  tx: TenantClient,
  input: InsertFeedbackRequestInput,
): Promise<unknown> {
  return tx.feedbackRequest.create({ data: input });
}

export interface InsertFeedbackInput {
  id: string;
  organizationId: string;
  authorId: string;
  recipientId: string;
  body: string;
  classification: "Strength" | "Improvement";
  projectId: string | null;
  value: string | null;
  requestId: string | null;
}

export function insertFeedback(tx: TenantClient, input: InsertFeedbackInput): Promise<unknown> {
  return tx.feedback.create({ data: input });
}

export function findFeedbackRequestById(tx: TenantClient, requestId: string) {
  return tx.feedbackRequest.findUnique({
    where: { id: requestId },
    include: { feedback: { select: { id: true } } },
  });
}

export function listFeedbackForParticipant(tx: TenantClient, memberId: string) {
  return tx.feedback.findMany({
    where: { OR: [{ authorId: memberId }, { recipientId: memberId }] },
    select: {
      id: true,
      authorId: true,
      recipientId: true,
      body: true,
      classification: true,
      projectId: true,
      value: true,
      requestId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findFeedbackReceivedBy(
  tx: TenantClient,
  feedbackId: string,
  recipientId: string,
) {
  return tx.feedback.findFirst({
    where: { id: feedbackId, recipientId },
    select: { id: true },
  });
}

export function listFeedbackRequestsForParticipant(tx: TenantClient, memberId: string) {
  return tx.feedbackRequest.findMany({
    where: { OR: [{ requesterId: memberId }, { requestedFromId: memberId }] },
    select: {
      id: true,
      requesterId: true,
      requestedFromId: true,
      prompt: true,
      createdAt: true,
      feedback: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Aggregate-only dashboard read: never selects private Feedback fields. */
export function countFeedbackReceivedSince(
  tx: TenantClient,
  memberIds: readonly string[],
  since: Date,
): Promise<number> {
  if (memberIds.length === 0) return Promise.resolve(0);
  return tx.feedback.count({
    where: {
      recipientId: { in: [...memberIds] },
      createdAt: { gte: since },
    },
  });
}
