import { z } from "zod";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { listMembers, requireActor } from "../../identity-org/application";
import { countFeedbackReceivedSince } from "../infrastructure/feedback-repo";

const feedbackHealthInput = z.object({
  actorClerkUserId: z.string().trim().min(1),
  since: z.date(),
  groups: z.array(
    z.object({
      groupId: z.string().trim().min(1),
      memberIds: z.array(z.string().uuid()),
    }),
  ),
});

export interface FeedbackHealthGroupInput {
  groupId: string;
  memberIds: readonly string[];
}

export interface GetFeedbackHealthInput {
  actorClerkUserId: string;
  since: Date;
  groups: readonly FeedbackHealthGroupInput[];
}

export interface FeedbackHealthView {
  groupId: string;
  memberCount: number;
  completedFeedbackCount: number;
}

export async function getFeedbackHealth(
  input: GetFeedbackHealthInput,
  client: PrismaClient = prismaClient(),
): Promise<FeedbackHealthView[]> {
  const parsed = feedbackHealthInput.parse(input);
  const groups = parsed.groups.map((group) => ({
    groupId: group.groupId,
    memberIds: [...new Set(group.memberIds)],
  }));
  const tenantMemberIds = new Set(
    (await listMembers({ actorClerkUserId: parsed.actorClerkUserId }, client)).map(
      (member) => member.id,
    ),
  );
  if (
    groups.some((group) => group.memberIds.some((memberId) => !tenantMemberIds.has(memberId)))
  ) {
    throw new ApplicationError("feedback-growth/member-not-found", "Member not found");
  }

  return withTenantForUser(
    parsed.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, parsed.actorClerkUserId);
      const health: FeedbackHealthView[] = [];
      for (const group of groups) {
        health.push({
          groupId: group.groupId,
          memberCount: group.memberIds.length,
          completedFeedbackCount: await countFeedbackReceivedSince(
            tx,
            group.memberIds,
            parsed.since,
          ),
        });
      }
      return health;
    },
    client,
  );
}
