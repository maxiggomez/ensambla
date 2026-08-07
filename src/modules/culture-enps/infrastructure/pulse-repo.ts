import type { TenantClient } from "../../../shared/db";
import type { PulseScope } from "../domain/pulse";

export async function createPulseWithAudience(
  tx: TenantClient,
  input: {
    organizationId: string;
    scope: PulseScope;
    memberIds: string[];
    openedAt?: Date;
    scheduleId?: string;
    scheduledFor?: Date;
  },
): Promise<{ pulseId: string }> {
  const pulse = await tx.pulse.create({
    data: {
      organizationId: input.organizationId,
      scope: input.scope.type === "organization" ? "Organization" : "Team",
      teamId: input.scope.type === "team" ? input.scope.teamId : null,
      openedAt: input.openedAt,
      scheduleId: input.scheduleId,
      scheduledFor: input.scheduledFor,
    },
    select: { id: true },
  });
  if (input.memberIds.length > 0) {
    await tx.pulseParticipation.createMany({
      data: input.memberIds.map((memberId) => ({
        organizationId: input.organizationId,
        pulseId: pulse.id,
        memberId,
      })),
    });
  }
  return { pulseId: pulse.id };
}

export async function listTeamPulseIds(tx: TenantClient, teamId: string): Promise<string[]> {
  const pulses = await tx.pulse.findMany({
    where: { scope: "Team", teamId },
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  return pulses.map((pulse) => pulse.id);
}

export async function listPulseIds(tx: TenantClient): Promise<string[]> {
  const pulses = await tx.pulse.findMany({
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  return pulses.map((pulse) => pulse.id);
}
