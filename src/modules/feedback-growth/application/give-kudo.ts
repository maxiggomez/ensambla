import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getKeyResultContext, getObjective } from "../../okrs/application";
import { getStrategy } from "../../strategy-northstar/application";
import { parseKudo } from "../domain/kudo";
import { insertKudo } from "../infrastructure/kudo-repo";

import { actorFromMembers, feedbackMembers, memberById } from "./member-context";

export interface GiveKudoInput {
  actorClerkUserId: string;
  recipientMemberId: string;
  message: string;
  value: string;
  objectiveId?: string | null;
  keyResultId?: string | null;
}

export async function giveKudo(
  input: GiveKudoInput,
  client: PrismaClient = prismaClient(),
): Promise<{ kudoId: string }> {
  const objectiveId = input.objectiveId?.trim() || null;
  const keyResultId = input.keyResultId?.trim() || null;
  if (objectiveId && keyResultId) {
    throw new ApplicationError(
      "feedback-growth/ambiguous-kudo-context",
      "Kudo can reference an Objective or a KeyResult, not both",
    );
  }
  const members = await feedbackMembers(input.actorClerkUserId, client);
  const giver = actorFromMembers(members, input.actorClerkUserId);
  const recipient = memberById(members, input.recipientMemberId);
  const kudo = parseKudo({
    giverId: giver.id,
    recipientId: recipient.id,
    message: input.message,
    value: input.value,
  });
  const strategy = await getStrategy({ actorClerkUserId: input.actorClerkUserId }, client);
  if (!strategy.values.includes(kudo.value)) {
    throw new ApplicationError("feedback-growth/value-not-found", "Value not found");
  }
  let objectiveTitleSnapshot: string | null = null;
  let keyResultTitleSnapshot: string | null = null;
  if (objectiveId) {
    const objective = await getObjective(
      { actorClerkUserId: input.actorClerkUserId, objectiveId },
      client,
    );
    objectiveTitleSnapshot = objective.title;
  }
  if (keyResultId) {
    const context = await getKeyResultContext(
      { actorClerkUserId: input.actorClerkUserId, keyResultId },
      client,
    );
    objectiveTitleSnapshot = context.objectiveTitle;
    keyResultTitleSnapshot = context.keyResultTitle;
  }

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      const kudoId = randomUUID();
      await insertKudo(tx, {
        id: kudoId,
        organizationId: actor.organizationId,
        giverId: kudo.giverId,
        recipientId: kudo.recipientId,
        message: kudo.message,
        value: kudo.value,
        objectiveId,
        objectiveTitleSnapshot,
        keyResultId,
        keyResultTitleSnapshot,
      });
      return { kudoId };
    },
    client,
  );
}
