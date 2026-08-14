import type { Member, PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { listMembers } from "../../identity-org/application";

export async function feedbackMembers(
  actorClerkUserId: string,
  client: PrismaClient,
): Promise<Member[]> {
  return listMembers({ actorClerkUserId }, client);
}

export function memberById(members: readonly Member[], memberId: string): Member {
  const member = members.find((candidate) => candidate.id === memberId);
  if (!member) {
    throw new ApplicationError("feedback-growth/member-not-found", "Member not found");
  }
  return member;
}

export function actorFromMembers(members: readonly Member[], clerkUserId: string): Member {
  const actor = members.find((member) => member.clerkUserId === clerkUserId);
  if (!actor) {
    throw new ApplicationError("identity-org/actor-not-found", "Actor not found");
  }
  return actor;
}
