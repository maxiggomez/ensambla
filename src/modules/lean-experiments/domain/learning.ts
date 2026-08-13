import { DomainError } from "../../../shared/errors";

export const LEARNING_DECISIONS = ["persevere", "pivot"] as const;
export type LearningDecision = (typeof LEARNING_DECISIONS)[number];

export interface LearningInput {
  believed: string;
  tested: string;
  learned: string;
  decision: string;
}

export interface ParsedLearning {
  believed: string;
  tested: string;
  learned: string;
  decision: LearningDecision;
}

export function parseLearning(input: LearningInput): ParsedLearning {
  const believed = input.believed.trim();
  const tested = input.tested.trim();
  const learned = input.learned.trim();
  const decision = input.decision.trim();
  if (
    !believed ||
    !tested ||
    !learned ||
    !(LEARNING_DECISIONS as readonly string[]).includes(decision)
  ) {
    throw new DomainError(
      "lean-experiments/invalid-learning",
      "Believed, tested, learned and a persevere/pivot decision are required",
    );
  }
  return { believed, tested, learned, decision: decision as LearningDecision };
}
