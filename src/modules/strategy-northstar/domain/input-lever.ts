import { DomainError } from "../../../shared/errors";

/** Input lever de la North Star, opcionalmente vinculado a un Objective. */
export interface InputLever {
  name: string;
  objectiveId: string | null;
}

export function inputLever(input: { name: string; objectiveId?: string | null }): InputLever {
  const name = input.name.trim();
  if (name === "") {
    throw new DomainError(
      "strategy-northstar/invalid-lever-name",
      "Input lever name must not be empty",
    );
  }
  return { name, objectiveId: input.objectiveId ?? null };
}
