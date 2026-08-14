import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getCompetencyMatrix } from "../../skills-matrix/application";
import { getProjectContext } from "../../teams-staffing/application";
import { deriveGrowthProgress } from "../domain/growth-plan";
import { findGrowthPlanForMember } from "../infrastructure/growth-plan-repo";

import { listPrivateFeedback } from "./list-private-feedback";

export type GrowthEvidenceView =
  | {
      source: "feedback";
      feedbackId: string;
      body: string;
      authorName: string;
    }
  | {
      source: "project";
      projectId: string;
      projectName: string;
    };

export interface GrowthPlanView {
  growthPlanId: string;
  nextMilestone: string;
  progress: number;
  targets: Array<{
    skillId: string;
    skillName: string;
    targetLevel: number;
    currentLevel: number;
    gap: number;
  }>;
  evidence: GrowthEvidenceView[];
}

export async function getGrowthPlan(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<GrowthPlanView | null> {
  const matrix = await getCompetencyMatrix(
    { actorClerkUserId: input.actorClerkUserId },
    client,
  );
  const result = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      return { actor, plan: await findGrowthPlanForMember(tx, actor.id) };
    },
    client,
  );
  if (!result.plan) return null;
  const row = matrix.rows.find((candidate) => candidate.memberId === result.actor.id);
  const derived = deriveGrowthProgress(result.plan.targets, row?.levels ?? {});
  const skillNames = new Map(matrix.skills.map((skill) => [skill.skillId, skill.name]));
  const feedbackById = new Map(
    (await listPrivateFeedback(input, client)).map((feedback) => [
      feedback.feedbackId,
      feedback,
    ]),
  );
  const evidence: GrowthEvidenceView[] = [];
  for (const item of result.plan.evidence) {
    if (item.source === "Feedback" && item.feedbackId) {
      const feedback = feedbackById.get(item.feedbackId);
      if (feedback) {
        evidence.push({
          source: "feedback",
          feedbackId: feedback.feedbackId,
          body: feedback.body,
          authorName: feedback.authorName,
        });
      }
    }
    if (item.source === "Project" && item.projectId) {
      const project = await getProjectContext(
        { actorClerkUserId: input.actorClerkUserId, projectId: item.projectId },
        client,
      );
      evidence.push({
        source: "project",
        projectId: project.projectId,
        projectName: project.name,
      });
    }
  }
  return {
    growthPlanId: result.plan.id,
    nextMilestone: result.plan.nextMilestone,
    progress: derived.progress,
    targets: derived.targets.map((target) => ({
      ...target,
      skillName: skillNames.get(target.skillId) ?? "Skill",
    })),
    evidence,
  };
}
