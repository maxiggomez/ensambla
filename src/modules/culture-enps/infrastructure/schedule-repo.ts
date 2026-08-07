import type { TenantClient } from "../../../shared/db";
import type { PulseScope } from "../domain/pulse";
import type { PulseFrequency } from "../domain/recurrence";

import { createPulseWithAudience } from "./pulse-repo";

const FREQUENCY_TO_COLUMN = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
} as const;

const FREQUENCY_FROM_COLUMN = {
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
} as const;

export async function createPulseSchedule(
  tx: TenantClient,
  input: {
    organizationId: string;
    scope: PulseScope;
    frequency: PulseFrequency;
    nextRunAt: Date;
  },
): Promise<{ scheduleId: string }> {
  const schedule = await tx.pulseSchedule.create({
    data: {
      organizationId: input.organizationId,
      scope: input.scope.type === "organization" ? "Organization" : "Team",
      teamId: input.scope.type === "team" ? input.scope.teamId : null,
      frequency: FREQUENCY_TO_COLUMN[input.frequency],
      nextRunAt: input.nextRunAt,
    },
    select: { id: true },
  });
  return { scheduleId: schedule.id };
}

export async function listDuePulseSchedules(tx: TenantClient, now: Date) {
  const schedules = await tx.pulseSchedule.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    orderBy: [{ nextRunAt: "asc" }, { id: "asc" }],
  });
  return schedules.map((schedule) => ({
    id: schedule.id,
    organizationId: schedule.organizationId,
    scope:
      schedule.scope === "Organization"
        ? ({ type: "organization" } as const)
        : ({ type: "team", teamId: schedule.teamId! } as const),
    frequency: FREQUENCY_FROM_COLUMN[schedule.frequency],
    scheduledFor: schedule.nextRunAt,
  }));
}

export async function claimScheduleAndCreatePulse(
  tx: TenantClient,
  input: {
    scheduleId: string;
    organizationId: string;
    scope: PulseScope;
    memberIds: string[];
    scheduledFor: Date;
    nextRunAt: Date;
  },
): Promise<string | null> {
  const claimed = await tx.pulseSchedule.updateMany({
    where: { id: input.scheduleId, active: true, nextRunAt: input.scheduledFor },
    data: { nextRunAt: input.nextRunAt },
  });
  if (claimed.count === 0) return null;

  const created = await createPulseWithAudience(tx, {
    organizationId: input.organizationId,
    scope: input.scope,
    memberIds: input.memberIds,
    openedAt: input.scheduledFor,
    scheduleId: input.scheduleId,
    scheduledFor: input.scheduledFor,
  });
  return created.pulseId;
}
