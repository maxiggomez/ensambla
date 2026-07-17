/**
 * Gaps de skills (D4, umbrales aprobados en gate — constantes nombradas,
 * configurables en un slice futuro). La demanda viene de OKRs publicados.
 */

/** Una persona "cubre" una skill con nivel ≥ 3. */
export const COVERAGE_LEVEL = 3;
/** Gap de cobertura: menos de 2 personas cubren una skill demandada. */
export const COVERAGE_MIN_PEOPLE = 2;
/** El gap exige demanda repetida: ≥ 2 Objectives publicados la requieren. */
export const GAP_MIN_OBJECTIVES = 2;

export interface SkillDemand {
  skillId: string;
  /** Objectives publicados (distintos) que requieren la skill. */
  requiringObjectiveIds: readonly string[];
  /** Personas con nivel ≥ COVERAGE_LEVEL en la skill. */
  coverageCount: number;
}

export interface SkillGaps {
  coverageGaps: string[];
  busFactorRisks: string[];
}

export function evaluateGaps(demands: readonly SkillDemand[]): SkillGaps {
  return {
    coverageGaps: demands
      .filter(
        (demand) =>
          demand.requiringObjectiveIds.length >= GAP_MIN_OBJECTIVES &&
          demand.coverageCount < COVERAGE_MIN_PEOPLE,
      )
      .map((demand) => demand.skillId),
    busFactorRisks: demands
      .filter(
        (demand) => demand.requiringObjectiveIds.length >= 1 && demand.coverageCount === 1,
      )
      .map((demand) => demand.skillId),
  };
}
