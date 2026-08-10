import { DomainError } from "../../../shared/errors";

/** Pilar estratégico que agrupa uno o más Objectives. */
export interface StrategicPillar {
  name: string;
  description: string | null;
}

export function strategicPillar(input: {
  name: string;
  description?: string | null;
}): StrategicPillar {
  const name = input.name.trim();
  if (name === "") {
    throw new DomainError(
      "strategy-northstar/invalid-pillar-name",
      "Strategic pillar name must not be empty",
    );
  }
  const description =
    input.description === null || input.description === undefined
      ? null
      : input.description.trim();
  return { name, description };
}
