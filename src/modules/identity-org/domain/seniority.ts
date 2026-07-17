export const SENIORITIES = ["Junior", "SemiSenior", "Senior"] as const;
export type Seniority = (typeof SENIORITIES)[number];

/** Orden para staffing: Senior 3 · SemiSenior 2 · Junior 1 · sin dato 0. */
export function seniorityRank(seniority: Seniority | null | undefined): number {
  switch (seniority) {
    case "Senior":
      return 3;
    case "SemiSenior":
      return 2;
    case "Junior":
      return 1;
    default:
      return 0;
  }
}
