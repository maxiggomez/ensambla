import { DomainError } from "../../../shared/errors";

export interface HypothesisInput {
  belief: string;
  expectedOutcome: string;
}

export interface ParsedHypothesis extends HypothesisInput {
  statement: string;
}

export function parseHypothesis(input: HypothesisInput): ParsedHypothesis {
  const belief = input.belief.trim();
  const expectedOutcome = input.expectedOutcome.trim();
  if (!belief || !expectedOutcome) {
    throw new DomainError(
      "lean-experiments/invalid-hypothesis",
      "Belief and expected outcome are required",
    );
  }
  return {
    belief,
    expectedOutcome,
    statement: `We believe ${belief} → we expect ${expectedOutcome}`,
  };
}
