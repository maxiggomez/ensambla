import { DomainError } from "../../../shared/errors";

export type PulseScope = { type: "organization" } | { type: "team"; teamId: string };

type PulseScopeInput =
  { type: "organization"; teamId?: string } | { type: "team"; teamId?: string };

export function parsePulseScope(input: PulseScopeInput): PulseScope {
  if (input.type === "organization") {
    if (input.teamId !== undefined) {
      throw new DomainError(
        "culture-enps/invalid-scope",
        "Organization scope cannot include a Team",
      );
    }
    return { type: "organization" };
  }

  const teamId = input.teamId?.trim();
  if (!teamId) {
    throw new DomainError("culture-enps/invalid-scope", "Team scope requires a Team");
  }
  return { type: "team", teamId };
}
