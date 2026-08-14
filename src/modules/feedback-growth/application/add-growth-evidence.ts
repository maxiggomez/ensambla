import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getProjectContext } from "../../teams-staffing/application";
import {
  findGrowthPlanForMember,
  insertGrowthEvidence,
} from "../infrastructure/growth-plan-repo";
import { findFeedbackReceivedBy } from "../infrastructure/feedback-repo";

import { listPrivateFeedback } from "./list-private-feedback";

export type AddGrowthEvidenceInput =
  | { actorClerkUserId: string; source: "feedback"; feedbackId: string }
  | { actorClerkUserId: string; source: "project"; projectId: string };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function addGrowthEvidence(
  input: AddGrowthEvidenceInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  let feedbackId: string | null = null;
  let projectId: string | null = null;
  if (input.source === "feedback") {
    const membersFeedback = (await listPrivateFeedback(input, client)).find(
      (candidate) => candidate.feedbackId === input.feedbackId,
    );
    if (!membersFeedback) {
      throw new ApplicationError(
        "feedback-growth/evidence-not-eligible",
        "Feedback is not eligible for this GrowthPlan",
      );
    }
    feedbackId = membersFeedback.feedbackId;
  } else {
    const project = await getProjectContext(
      { actorClerkUserId: input.actorClerkUserId, projectId: input.projectId },
      client,
    );
    if (project.status !== "Closed") {
      throw new ApplicationError(
        "feedback-growth/evidence-not-eligible",
        "Only a Closed Project is eligible for GrowthPlan evidence",
      );
    }
    projectId = project.projectId;
  }

  try {
    await withTenantForUser(
      input.actorClerkUserId,
      async (tx) => {
        const actor = await requireActor(tx, input.actorClerkUserId);
        const plan = await findGrowthPlanForMember(tx, actor.id);
        if (!plan) {
          throw new ApplicationError("feedback-growth/plan-not-found", "GrowthPlan not found");
        }
        if (feedbackId) {
          const feedback = await findFeedbackReceivedBy(tx, feedbackId, actor.id);
          if (!feedback) {
            throw new ApplicationError(
              "feedback-growth/evidence-not-eligible",
              "Feedback is not eligible for this GrowthPlan",
            );
          }
        }
        await insertGrowthEvidence(tx, {
          id: randomUUID(),
          organizationId: actor.organizationId,
          growthPlanId: plan.id,
          source: input.source === "feedback" ? "Feedback" : "Project",
          feedbackId,
          projectId,
        });
      },
      client,
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApplicationError(
        "feedback-growth/evidence-exists",
        "GrowthPlan evidence already exists",
      );
    }
    throw error;
  }
}
