import { DomainError } from "../../../shared/errors";

export const FEEDBACK_CLASSIFICATIONS = ["strength", "improvement"] as const;
export type FeedbackClassification = (typeof FEEDBACK_CLASSIFICATIONS)[number];

export interface FeedbackInput {
  authorId: string;
  recipientId: string;
  body: string;
  classification: unknown;
}

export interface ParsedFeedback {
  authorId: string;
  recipientId: string;
  body: string;
  classification: FeedbackClassification;
}

export function parseFeedback(input: FeedbackInput): ParsedFeedback {
  const authorId = input.authorId.trim();
  const recipientId = input.recipientId.trim();
  const body = input.body.trim();
  const classification = FEEDBACK_CLASSIFICATIONS.find(
    (candidate) => candidate === input.classification,
  );

  if (!authorId || !recipientId || !body || !classification || authorId === recipientId) {
    throw new DomainError(
      "feedback-growth/invalid-feedback",
      "Feedback requires distinct participants, content, and a valid classification",
    );
  }

  return { authorId, recipientId, body, classification };
}

export interface FeedbackRequestInput {
  requesterId: string;
  requestedFromId: string;
  prompt: string;
}

export function parseFeedbackRequest(input: FeedbackRequestInput): FeedbackRequestInput {
  const requesterId = input.requesterId.trim();
  const requestedFromId = input.requestedFromId.trim();
  const prompt = input.prompt.trim();
  if (!requesterId || !requestedFromId || !prompt || requesterId === requestedFromId) {
    throw new DomainError(
      "feedback-growth/invalid-request",
      "FeedbackRequest requires distinct Members and a prompt",
    );
  }
  return { requesterId, requestedFromId, prompt };
}
