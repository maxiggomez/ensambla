import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { effectiveCadence, isCheckInDue } from "../domain/cadence";
import { listReminderCandidates } from "../infrastructure/cadence-repo";

export interface ListDueCheckInRemindersInput {
  actorClerkUserId: string;
  now?: Date;
}

export interface CheckInReminderView {
  objectiveId: string;
  keyResultId: string;
  objectiveTitle: string;
  keyResultTitle: string;
}

export async function listDueCheckInReminders(
  input: ListDueCheckInRemindersInput,
  client: PrismaClient = prismaClient(),
): Promise<CheckInReminderView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const objectives = await listReminderCandidates(tx);
      return objectives.flatMap((objective) => {
        const objectiveCadence = objective.cadenceConfigs[0]?.cadence ?? null;
        const teamCadence = objective.team?.cadenceConfigs[0]?.cadence ?? null;
        const cadence = effectiveCadence(objectiveCadence, teamCadence);
        return objective.keyResults
          .filter((keyResult) =>
            isCheckInDue({
              cadence,
              baselineAt:
                keyResult.checkIns[0]?.createdAt ??
                objective.publishedAt ??
                objective.createdAt,
              now: input.now ?? new Date(),
            }),
          )
          .map((keyResult) => ({
            objectiveId: objective.id,
            keyResultId: keyResult.id,
            objectiveTitle: objective.title,
            keyResultTitle: keyResult.title,
          }));
      });
    },
    client,
  );
}
