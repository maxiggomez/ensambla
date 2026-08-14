const DAY_MS = 24 * 60 * 60 * 1000;
export const DASHBOARD_WINDOW_DAYS = 30;

export type CultureFact =
  | { status: "visible"; score: number; participation: number }
  | { status: "suppressed"; minimumResponses: number };

export type DashboardMetrics = {
  okrs:
    { status: "empty" } | { status: "ready"; publishedObjectives: number; progress: number };
  teams: { status: "empty" } | { status: "ready"; healthy: number; total: number };
  culture:
    | { status: "empty" }
    | { status: "protected"; minimumResponses: number }
    | { status: "visible"; score: number; participation: number };
  learning:
    | { status: "empty" }
    | { status: "ready"; current: number; previous: number; change: number };
};

export interface ConsolidatedMetricFacts {
  now: Date;
  objectives: readonly { status: "Draft" | "Published"; progress: number }[];
  teams: readonly { teamId: string; memberCount: number; overloaded: boolean }[];
  retrospectiveRisks: readonly { teamId: string; atRisk: boolean }[];
  culture: CultureFact | null;
  learnings: readonly { createdAt: Date }[];
}

export function buildConsolidatedMetrics(input: ConsolidatedMetricFacts): DashboardMetrics {
  const published = input.objectives.filter((objective) => objective.status === "Published");
  const retrospectiveRiskIds = new Set(
    input.retrospectiveRisks.filter((risk) => risk.atRisk).map((risk) => risk.teamId),
  );
  const currentBoundary = new Date(input.now.getTime() - DASHBOARD_WINDOW_DAYS * DAY_MS);
  const previousBoundary = new Date(input.now.getTime() - DASHBOARD_WINDOW_DAYS * 2 * DAY_MS);
  const currentLearnings = input.learnings.filter(
    (learning) => learning.createdAt >= currentBoundary && learning.createdAt <= input.now,
  ).length;
  const previousLearnings = input.learnings.filter(
    (learning) =>
      learning.createdAt >= previousBoundary && learning.createdAt < currentBoundary,
  ).length;

  return {
    okrs:
      published.length === 0
        ? { status: "empty" }
        : {
            status: "ready",
            publishedObjectives: published.length,
            progress:
              published.reduce((total, objective) => total + objective.progress, 0) /
              published.length,
          },
    teams:
      input.teams.length === 0
        ? { status: "empty" }
        : {
            status: "ready",
            total: input.teams.length,
            healthy: input.teams.filter(
              (team) =>
                team.memberCount > 0 &&
                !team.overloaded &&
                !retrospectiveRiskIds.has(team.teamId),
            ).length,
          },
    culture:
      input.culture === null
        ? { status: "empty" }
        : input.culture.status === "suppressed"
          ? { status: "protected", minimumResponses: input.culture.minimumResponses }
          : input.culture,
    learning:
      currentLearnings === 0 && previousLearnings === 0
        ? { status: "empty" }
        : {
            status: "ready",
            current: currentLearnings,
            previous: previousLearnings,
            change: currentLearnings - previousLearnings,
          },
  };
}

export type DashboardRiskKind =
  "key-result-alignment" | "team-capacity" | "feedback-activity" | "retrospective";

export interface DashboardRisk {
  id: string;
  kind: DashboardRiskKind;
  severity: "critical" | "attention";
  subjectId: string;
  title: string;
  detail: string;
  suggestedAction: string;
  teamId: string | null;
}

export interface DashboardRiskFacts {
  keyResultsWithoutProject: readonly { keyResultId: string; title: string }[];
  teams: readonly {
    teamId: string;
    name: string;
    capacity: number;
    overloaded: boolean;
  }[];
  retrospectiveRisks: readonly { teamId: string; atRisk: boolean }[];
  feedbackHealth: readonly {
    groupId: string;
    memberCount: number;
    completedFeedbackCount: number;
  }[];
}

export function evaluateDashboardRisks(input: DashboardRiskFacts): DashboardRisk[] {
  const teamsById = new Map(input.teams.map((team) => [team.teamId, team]));
  const risks: DashboardRisk[] = [];

  for (const keyResult of input.keyResultsWithoutProject) {
    risks.push({
      id: `key-result-alignment:${keyResult.keyResultId}`,
      kind: "key-result-alignment",
      severity: "critical",
      subjectId: keyResult.keyResultId,
      title: `${keyResult.title} sin proyecto que lo mueva`,
      detail: "El Key Result publicado no tiene una iniciativa vinculada.",
      suggestedAction: "Vinculá un proyecto activo al objetivo de este Key Result.",
      teamId: null,
    });
  }
  for (const team of input.teams.filter((candidate) => candidate.overloaded)) {
    risks.push({
      id: `team-capacity:${team.teamId}`,
      kind: "team-capacity",
      severity: "critical",
      subjectId: team.teamId,
      title: `${team.name} supera su capacidad`,
      detail: `La carga derivada del Team es ${team.capacity}%.`,
      suggestedAction: "Reequilibrá asignaciones hasta volver a 100% o menos.",
      teamId: team.teamId,
    });
  }
  for (const health of input.feedbackHealth) {
    if (health.memberCount === 0 || health.completedFeedbackCount >= health.memberCount)
      continue;
    const team = teamsById.get(health.groupId);
    risks.push({
      id: `feedback-activity:${health.groupId}`,
      kind: "feedback-activity",
      severity: "attention",
      subjectId: health.groupId,
      title: `${team?.name ?? "Team"} tiene Feedback bajo`,
      detail: `${health.completedFeedbackCount} Feedback completados para ${health.memberCount} integrantes en 30 días.`,
      suggestedAction: "Abrí una ronda de Feedback para el Team.",
      teamId: health.groupId,
    });
  }
  for (const retrospective of input.retrospectiveRisks.filter((risk) => risk.atRisk)) {
    const team = teamsById.get(retrospective.teamId);
    risks.push({
      id: `retrospective:${retrospective.teamId}`,
      kind: "retrospective",
      severity: "attention",
      subjectId: retrospective.teamId,
      title: `${team?.name ?? "Team"} necesita una retrospectiva`,
      detail: "Pasaron al menos dos ciclos sin registrar una retrospectiva.",
      suggestedAction: "Agendá y registrá la próxima retrospectiva del Team.",
      teamId: retrospective.teamId,
    });
  }

  return risks.sort(
    (left, right) =>
      severityOrder(left.severity) - severityOrder(right.severity) ||
      left.kind.localeCompare(right.kind) ||
      left.subjectId.localeCompare(right.subjectId),
  );
}

function severityOrder(severity: DashboardRisk["severity"]): number {
  return severity === "critical" ? 0 : 1;
}
