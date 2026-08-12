import { DomainError } from "../../../shared/errors";

/** Estatutos de la Organization: visión, misión y valores. Todos opcionales. */
export interface StrategyStatement {
  vision: string | null;
  mission: string | null;
  values: string[];
}

export function strategyStatement(input: {
  vision?: string | null;
  mission?: string | null;
  values?: string[] | null;
}): StrategyStatement {
  const vision = normalizeOptional(input.vision, "strategy-northstar/invalid-vision");
  const mission = normalizeOptional(input.mission, "strategy-northstar/invalid-mission");
  const values = (input.values ?? []).map((value) => value.trim());
  if (values.some((value) => value === "")) {
    throw new DomainError(
      "strategy-northstar/invalid-value",
      "Strategy values must not be empty",
    );
  }
  return { vision, mission, values };
}

function normalizeOptional(value: string | null | undefined, code: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new DomainError(code, `${code} statement must not be empty`);
  }
  return trimmed;
}
