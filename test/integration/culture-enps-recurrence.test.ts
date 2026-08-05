import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  configurePulseSchedule,
  generateDuePulses,
} from "../../src/modules/culture-enps/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("culture-enps recurring pulses", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let orgB: OrganizationId;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "recurrence_direction_a",
        name: "Recurrence A",
        creatorEmail: "direction@recurrence-a.test",
        creatorName: "Dirección A",
      },
      db.prisma,
    ));
    await inviteMember(
      {
        actorClerkUserId: "recurrence_direction_a",
        email: "person@recurrence-a.test",
        name: "Persona A",
        role: "Colaborador",
      },
      db.prisma,
    );
    ({ organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "recurrence_direction_b",
        name: "Recurrence B",
        creatorEmail: "direction@recurrence-b.test",
        creatorName: "Dirección B",
      },
      db.prisma,
    ));
  });

  afterAll(async () => {
    await db.stop();
  });

  it("generates a due pulse, advances the schedule, and is retry-idempotent", async () => {
    const { scheduleId } = await configurePulseSchedule(
      {
        actorClerkUserId: "recurrence_direction_a",
        scope: { type: "organization" },
        frequency: "weekly",
        nextRunAt: new Date("2026-08-04T09:00:00.000Z"),
      },
      db.prisma,
    );

    const first = await generateDuePulses(
      {
        actorClerkUserId: "recurrence_direction_a",
        now: new Date("2026-08-04T10:00:00.000Z"),
      },
      db.prisma,
    );
    const retry = await generateDuePulses(
      {
        actorClerkUserId: "recurrence_direction_a",
        now: new Date("2026-08-04T10:00:00.000Z"),
      },
      db.prisma,
    );

    expect(first.generatedPulseIds).toHaveLength(1);
    expect(retry.generatedPulseIds).toEqual([]);
    const stored = await withTenant(
      orgA,
      async (tx) => {
        const pulses = await tx.pulse.findMany({ where: { scheduleId } });
        return {
          schedule: await tx.pulseSchedule.findUniqueOrThrow({ where: { id: scheduleId } }),
          pulses,
          participations: await tx.pulseParticipation.findMany({
            where: { pulseId: { in: pulses.map((pulse) => pulse.id) } },
          }),
        };
      },
      db.prisma,
    );
    expect(stored.schedule.nextRunAt).toEqual(new Date("2026-08-11T09:00:00.000Z"));
    expect(stored.pulses).toHaveLength(1);
    expect(stored.pulses[0]?.scheduledFor).toEqual(new Date("2026-08-04T09:00:00.000Z"));
    expect(stored.participations).toHaveLength(2);
  });

  it("processes only schedules in the authenticated actor's Organization", async () => {
    expect(await withTenant(orgB, (tx) => tx.pulse.findMany(), db.prisma)).toEqual([]);
    expect(await withTenant(orgB, (tx) => tx.pulseSchedule.findMany(), db.prisma)).toEqual([]);
  });
});
