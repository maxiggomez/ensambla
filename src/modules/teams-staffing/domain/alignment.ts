/**
 * Alineamiento Projects ↔ OKRs. Alertas siempre derivadas en lectura:
 * un Project sin Objectives vinculados es "project without OKR"; los
 * KeyResults de Objectives publicados sin ningún Project que los mueva son
 * riesgo de desalineamiento. Los drafts no alertan.
 */

export interface ProjectLinks {
  projectId: string;
  objectiveIds: readonly string[];
}

export interface ObjectiveSummary {
  objectiveId: string;
  status: "Draft" | "Published";
  keyResultIds: readonly string[];
}

export interface AlignmentAlerts {
  projectsWithoutOkr: string[];
  keyResultsWithoutProject: string[];
}

export function evaluateAlignment(
  projects: readonly ProjectLinks[],
  objectives: readonly ObjectiveSummary[],
): AlignmentAlerts {
  const coveredObjectiveIds = new Set(projects.flatMap((project) => [...project.objectiveIds]));
  return {
    projectsWithoutOkr: projects
      .filter((project) => project.objectiveIds.length === 0)
      .map((project) => project.projectId),
    keyResultsWithoutProject: objectives
      .filter(
        (objective) =>
          objective.status === "Published" && !coveredObjectiveIds.has(objective.objectiveId),
      )
      .flatMap((objective) => [...objective.keyResultIds]),
  };
}
