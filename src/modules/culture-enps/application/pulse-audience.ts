import { listMembers } from "../../identity-org/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import type { PrismaClient } from "../../../shared/db";
import type { PulseScope } from "../domain/pulse";

export async function resolvePulseAudience(
  actorClerkUserId: string,
  scope: PulseScope,
  client: PrismaClient,
) {
  const members = await listMembers({ actorClerkUserId }, client);
  const actor = members.find((member) => member.clerkUserId === actorClerkUserId);
  const memberIds =
    scope.type === "organization"
      ? members.map((member) => member.id)
      : (await listTeamAssignments({ actorClerkUserId, teamId: scope.teamId }, client)).map(
          (assignment) => assignment.memberId,
        );
  return { actor, memberIds };
}
