/**
 * Match de staffing (D3): orden lexicográfico explicable, sin pesos mágicos —
 * nivel promedio en las skills requeridas → seniority → disponibilidad →
 * nombre. "No margin" (carga ≥ 100) se sugiere igual, marcada: la spec lo
 * exige aunque el nivel sea alto.
 */

export interface StaffingCandidate {
  memberId: string;
  name: string;
  /** Rank de identity-org: Senior 3 · SemiSenior 2 · Junior 1 · sin dato 0. */
  seniorityRank: number;
  /** Carga total (suma de asignaciones, de teams-staffing). */
  load: number;
  /** Nivel del candidato en cada skill requerida (0 si no la tiene). */
  skillLevels: readonly number[];
}

export interface StaffingSuggestion {
  memberId: string;
  name: string;
  skillLevel: number;
  seniorityRank: number;
  availability: number;
  noMargin: boolean;
}

export function suggestCandidates(
  candidates: readonly StaffingCandidate[],
): StaffingSuggestion[] {
  return candidates
    .map((candidate) => {
      const skillLevel = average(candidate.skillLevels);
      return {
        memberId: candidate.memberId,
        name: candidate.name,
        skillLevel,
        seniorityRank: candidate.seniorityRank,
        availability: Math.max(0, 100 - candidate.load),
        noMargin: candidate.load >= 100,
      };
    })
    .filter((suggestion) => suggestion.skillLevel > 0)
    .sort(
      (a, b) =>
        b.skillLevel - a.skillLevel ||
        b.seniorityRank - a.seniorityRank ||
        b.availability - a.availability ||
        a.name.localeCompare(b.name),
    );
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
