import { DomainError } from "../../../shared/errors";

export interface KudoInput {
  giverId: string;
  recipientId: string;
  message: string;
  value: string;
}

export type ParsedKudo = KudoInput;

export function parseKudo(input: KudoInput): ParsedKudo {
  const giverId = input.giverId.trim();
  const recipientId = input.recipientId.trim();
  const message = input.message.trim();
  const value = input.value.trim();

  if (!giverId || !recipientId || !message || !value || giverId === recipientId) {
    throw new DomainError(
      "feedback-growth/invalid-kudo",
      "Kudo requires distinct participants, a message, and an Organization Value",
    );
  }

  return { giverId, recipientId, message, value };
}
