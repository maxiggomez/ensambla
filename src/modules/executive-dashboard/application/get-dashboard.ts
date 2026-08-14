import type { PrismaClient } from "../../../shared/db";
import { prismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import {
  getFeedbackHealth,
  getGrowthPlan,
  listFeedbackRequests,
  listPrivateFeedback,
  type GrowthPlanView,
} from "../../feedback-growth/application";
import { listMembers } from "../../identity-org/application";
import { listLearnings } from "../../lean-experiments/application";
import { listObjectives } from "../../okrs/application";
import { evaluateLearningRisks } from "../../rituals/application";
import {
  evaluateAlignment,
  listMemberLoads,
  listTeamAssignments,
  listTeamCapacities,
} from "../../teams-staffing/application";
import { listPendingPulses, listPulseResults } from "../../culture-enps/application";
import {
  buildConsolidatedMetrics,
  DASHBOARD_WINDOW_DAYS,
  evaluateDashboardRisks,
  type CultureFact,
  type DashboardMetrics,
  type DashboardRisk,
} from "../domain/dashboard-policy";
import {
  deriveDashboardScope,
  scopeObjectives,
  scopeTeamItems,
  type DashboardRole,
} from "../domain/dashboard-scope";

const DAY_MS = 24 * 60 * 60 * 1000;

interface SourceMember {
  id: string;
  clerkUserId: string | null;
  role: DashboardRole;
}

interface SourceObjective {
  id: string;
  title: string;
  status: "Draft" | "Published";
  progress: number;
  ownerId: string;
  teamId: string | null;
  keyResults: readonly { id: string; title: string }[];
}

interface SourceTeamCapacity {
  teamId: string;
  name: string;
  capacity: number;
  overloaded: boolean;
}

interface SourceTeamAssignment {
  memberId: string;
  role: "Lead" | "Contributor";
  capacityPercent: number;
}

interface SourcePulseResult {
  pulseId: string;
  scope: { type: "organization" } | { type: "team"; teamId: string };
  result:
    | { status: "suppressed"; minimumResponses: number }
    | {
        status: "visible";
        score: { current: number };
        participation: { current: number };
      };
}

interface SourceFeedback {
  authorId: string;
  recipientId: string;
}

interface SourceFeedbackRequest {
  pending: boolean;
}

interface SourcePendingPulse {
  pulseId: string;
  scope: { type: "organization" } | { type: "team"; teamId: string };
}

export interface DashboardSources {
  listMembers(actorClerkUserId: string, client: PrismaClient): Promise<SourceMember[]>;
  listObjectives(actorClerkUserId: string, client: PrismaClient): Promise<SourceObjective[]>;
  listTeamCapacities(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<SourceTeamCapacity[]>;
  listTeamAssignments(
    actorClerkUserId: string,
    teamId: string,
    client: PrismaClient,
  ): Promise<SourceTeamAssignment[]>;
  evaluateLearningRisks(
    actorClerkUserId: string,
    teamIds: readonly string[],
    client: PrismaClient,
  ): Promise<Array<{ teamId: string; atRisk: boolean }>>;
  listPulseResults(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<SourcePulseResult[]>;
  listLearnings(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<Array<{ objectiveId?: string; createdAt: Date }>>;
  evaluateAlignment(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<{ projectsWithoutOkr: string[]; keyResultsWithoutProject: string[] }>;
  getFeedbackHealth(
    actorClerkUserId: string,
    groups: readonly { groupId: string; memberIds: readonly string[] }[],
    since: Date,
    client: PrismaClient,
  ): Promise<Array<{ groupId: string; memberCount: number; completedFeedbackCount: number }>>;
  listMemberLoads(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<Array<{ memberId: string; load: number; overloaded: boolean }>>;
  listPrivateFeedback(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<SourceFeedback[]>;
  listFeedbackRequests(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<{ inbox: SourceFeedbackRequest[]; outbox: SourceFeedbackRequest[] }>;
  getGrowthPlan(actorClerkUserId: string, client: PrismaClient): Promise<GrowthPlanView | null>;
  listPendingPulses(
    actorClerkUserId: string,
    client: PrismaClient,
  ): Promise<SourcePendingPulse[]>;
}

export interface DashboardObjectiveView {
  id: string;
  title: string;
  progress: number;
  ownerId: string;
  teamId: string | null;
}

export interface DashboardTeamView {
  teamId: string;
  name: string;
  capacity: number;
  overloaded: boolean;
  memberCount: number;
}

interface OrganizationDashboardBase {
  metrics: DashboardMetrics;
  objectives: DashboardObjectiveView[];
  teams: DashboardTeamView[];
  risks: DashboardRisk[];
}

export type DashboardView =
  | ({ role: "Direccion" } & OrganizationDashboardBase)
  | ({ role: "Lider" } & OrganizationDashboardBase)
  | {
      role: "Colaborador";
      objectives: DashboardObjectiveView[];
      load: { load: number; overloaded: boolean } | null;
      feedback: { received: number; given: number; pendingRequests: number };
      growthPlan: GrowthPlanView | null;
      pendingPulses: SourcePendingPulse[];
    };

export interface GetDashboardOptions {
  now?: () => Date;
  sources?: DashboardSources;
}

export async function getDashboard(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
  options: GetDashboardOptions = {},
): Promise<DashboardView> {
  const sources = options.sources ?? defaultDashboardSources;
  const now = (options.now ?? (() => new Date()))();
  const members = await sources.listMembers(input.actorClerkUserId, client);
  const actor = members.find((member) => member.clerkUserId === input.actorClerkUserId);
  if (!actor) {
    throw new ApplicationError("identity-org/actor-not-found", "Actor not found");
  }

  const objectives = await sources.listObjectives(input.actorClerkUserId, client);
  if (actor.role === "Colaborador") {
    return collaboratorDashboard(actor.id, objectives, input.actorClerkUserId, sources, client);
  }
  return organizationDashboard(
    { ...actor, role: actor.role },
    objectives,
    input.actorClerkUserId,
    now,
    sources,
    client,
  );
}

async function organizationDashboard(
  actor: Omit<SourceMember, "role"> & { role: "Direccion" | "Lider" },
  objectives: SourceObjective[],
  actorClerkUserId: string,
  now: Date,
  sources: DashboardSources,
  client: PrismaClient,
): Promise<DashboardView> {
  const capacities = await sources.listTeamCapacities(actorClerkUserId, client);
  const assignments = new Map<string, SourceTeamAssignment[]>();
  for (const team of capacities) {
    assignments.set(
      team.teamId,
      await sources.listTeamAssignments(actorClerkUserId, team.teamId, client),
    );
  }
  const teamScopeFacts = capacities.map((team) => {
    const teamAssignments = assignments.get(team.teamId) ?? [];
    return {
      teamId: team.teamId,
      memberIds: teamAssignments.map((assignment) => assignment.memberId),
      leadMemberIds: teamAssignments
        .filter((assignment) => assignment.role === "Lead")
        .map((assignment) => assignment.memberId),
    };
  });
  const scope = deriveDashboardScope(actor.role, actor.id, teamScopeFacts);
  const scopedCapacities = scopeTeamItems(scope, capacities);
  const scopedObjectives = scopeObjectives(scope, objectives);
  const retrospectiveRisks = scopeTeamItems(
    scope,
    await sources.evaluateLearningRisks(actorClerkUserId, scope.teamIds, client),
  );
  const pulseResults = await sources.listPulseResults(actorClerkUserId, client);
  const learnings = await sources.listLearnings(actorClerkUserId, client);
  const alignment = await sources.evaluateAlignment(actorClerkUserId, client);
  const since = new Date(now.getTime() - DASHBOARD_WINDOW_DAYS * DAY_MS);
  const feedbackHealth = scopeTeamItems(
    scope,
    (
      await sources.getFeedbackHealth(
        actorClerkUserId,
        scope.teamIds.map((teamId) => ({
          groupId: teamId,
          memberIds: teamScopeFacts.find((team) => team.teamId === teamId)?.memberIds ?? [],
        })),
        since,
        client,
      )
    ).map((health) => ({ ...health, teamId: health.groupId })),
  );
  const scopedObjectiveIds = new Set(scopedObjectives.map((objective) => objective.id));
  const scopedKeyResults = new Map(
    scopedObjectives.flatMap((objective) =>
      objective.keyResults.map((keyResult) => [keyResult.id, keyResult] as const),
    ),
  );
  const scopedLearnings =
    actor.role === "Direccion"
      ? learnings
      : learnings.filter(
          (learning) =>
            learning.objectiveId === undefined || scopedObjectiveIds.has(learning.objectiveId),
        );
  const culture = latestCultureForScope(actor.role, scope.teamIds, pulseResults);
  const teamViews = scopedCapacities.map((team) => ({
    ...team,
    memberCount: assignments.get(team.teamId)?.length ?? 0,
  }));
  const metrics = buildConsolidatedMetrics({
    now,
    objectives: scopedObjectives,
    teams: teamViews,
    retrospectiveRisks,
    culture,
    learnings: scopedLearnings,
  });
  const risks = evaluateDashboardRisks({
    keyResultsWithoutProject: alignment.keyResultsWithoutProject.flatMap((keyResultId) => {
      const keyResult = scopedKeyResults.get(keyResultId);
      return keyResult ? [{ keyResultId, title: keyResult.title }] : [];
    }),
    teams: scopedCapacities,
    retrospectiveRisks,
    feedbackHealth: feedbackHealth.map((health) => ({
      groupId: health.groupId,
      memberCount: health.memberCount,
      completedFeedbackCount: health.completedFeedbackCount,
    })),
  });

  return {
    role: actor.role,
    metrics,
    objectives: scopedObjectives.map(toObjectiveView),
    teams: teamViews,
    risks,
  };
}

async function collaboratorDashboard(
  actorMemberId: string,
  objectives: SourceObjective[],
  actorClerkUserId: string,
  sources: DashboardSources,
  client: PrismaClient,
): Promise<DashboardView> {
  const scope = deriveDashboardScope("Colaborador", actorMemberId, []);
  const loads = await sources.listMemberLoads(actorClerkUserId, client);
  const feedback = await sources.listPrivateFeedback(actorClerkUserId, client);
  const requests = await sources.listFeedbackRequests(actorClerkUserId, client);
  const growthPlan = await sources.getGrowthPlan(actorClerkUserId, client);
  const pendingPulses = await sources.listPendingPulses(actorClerkUserId, client);
  const load = loads.find((candidate) => candidate.memberId === actorMemberId);

  return {
    role: "Colaborador",
    objectives: scopeObjectives(scope, objectives).map(toObjectiveView),
    load: load ? { load: load.load, overloaded: load.overloaded } : null,
    feedback: {
      received: feedback.filter((item) => item.recipientId === actorMemberId).length,
      given: feedback.filter((item) => item.authorId === actorMemberId).length,
      pendingRequests: requests.inbox.filter((request) => request.pending).length,
    },
    growthPlan,
    pendingPulses,
  };
}

function latestCultureForScope(
  role: "Direccion" | "Lider",
  teamIds: readonly string[],
  pulseResults: readonly SourcePulseResult[],
): CultureFact | null {
  const pulse = pulseResults.find((candidate) =>
    role === "Direccion"
      ? candidate.scope.type === "organization"
      : candidate.scope.type === "team" && teamIds.includes(candidate.scope.teamId),
  );
  if (!pulse) return null;
  return pulse.result.status === "suppressed"
    ? pulse.result
    : {
        status: "visible",
        score: pulse.result.score.current,
        participation: pulse.result.participation.current,
      };
}

function toObjectiveView(objective: SourceObjective): DashboardObjectiveView {
  return {
    id: objective.id,
    title: objective.title,
    progress: objective.progress,
    ownerId: objective.ownerId,
    teamId: objective.teamId,
  };
}

const defaultDashboardSources: DashboardSources = {
  listMembers: (actorClerkUserId, client) => listMembers({ actorClerkUserId }, client),
  listObjectives: (actorClerkUserId, client) => listObjectives({ actorClerkUserId }, client),
  listTeamCapacities: (actorClerkUserId, client) =>
    listTeamCapacities({ actorClerkUserId }, client),
  listTeamAssignments: (actorClerkUserId, teamId, client) =>
    listTeamAssignments({ actorClerkUserId, teamId }, client),
  evaluateLearningRisks: (actorClerkUserId, teamIds, client) =>
    evaluateLearningRisks({ actorClerkUserId, teamIds }, client),
  listPulseResults: (actorClerkUserId, client) =>
    listPulseResults({ actorClerkUserId }, client),
  listLearnings: (actorClerkUserId, client) => listLearnings({ actorClerkUserId }, client),
  evaluateAlignment: (actorClerkUserId, client) =>
    evaluateAlignment({ actorClerkUserId }, client),
  getFeedbackHealth: (actorClerkUserId, groups, since, client) =>
    getFeedbackHealth({ actorClerkUserId, groups, since }, client),
  listMemberLoads: (actorClerkUserId, client) => listMemberLoads({ actorClerkUserId }, client),
  listPrivateFeedback: (actorClerkUserId, client) =>
    listPrivateFeedback({ actorClerkUserId }, client),
  listFeedbackRequests: (actorClerkUserId, client) =>
    listFeedbackRequests({ actorClerkUserId }, client),
  getGrowthPlan: (actorClerkUserId, client) => getGrowthPlan({ actorClerkUserId }, client),
  listPendingPulses: (actorClerkUserId, client) =>
    listPendingPulses({ actorClerkUserId }, client),
};
