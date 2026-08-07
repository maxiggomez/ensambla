import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  analyzeTeamEnps,
  launchPulse,
  submitPulseResponse,
} from "../../src/modules/culture-enps/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { assignTeamMember, createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("falling Team eNPS correlated with capacity", () => {
  let db: TestDatabase;
  let orgId: OrganizationId;
  let teamId: string;
  const actors: string[] = [];

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgId } = await createOrganization(
      {
        clerkUserId: "correlation_direction",
        name: "Correlation Org",
        creatorEmail: "direction@correlation.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    ({ teamId } = await createTeam(
      { actorClerkUserId: "correlation_direction", name: "Growth" },
      db.prisma,
    ));
    for (let index = 1; index <= 4; index += 1) {
      const clerkUserId = `correlation_person_${index}`;
      actors.push(clerkUserId);
      const { memberId } = await inviteMember(
        {
          actorClerkUserId: "correlation_direction",
          email: `person-${index}@correlation.test`,
          name: `Persona ${index}`,
          role: "Colaborador",
        },
        db.prisma,
      );
      await withTenant(
        orgId,
        (tx) => tx.member.update({ where: { id: memberId }, data: { clerkUserId } }),
        db.prisma,
      );
      await assignTeamMember(
        {
          actorClerkUserId: "correlation_direction",
          teamId,
          memberId,
          role: "Contributor",
          capacityPercent: 30,
        },
        db.prisma,
      );
    }
  });

  afterAll(async () => {
    await db.stop();
  });

  async function createAnsweredPulse(scores: number[], openedAt: Date) {
    const { pulseId } = await launchPulse(
      { actorClerkUserId: "correlation_direction", scope: { type: "team", teamId } },
      db.prisma,
    );
    await withTenant(
      orgId,
      (tx) => tx.pulse.update({ where: { id: pulseId }, data: { openedAt } }),
      db.prisma,
    );
    for (let index = 0; index < scores.length; index += 1) {
      await submitPulseResponse(
        {
          actorClerkUserId: actors[index]!,
          pulseId,
          score: scores[index]!,
          driver: "Workload",
        },
        db.prisma,
      );
    }
    return pulseId;
  }

  it("reports a non-causal coincidence for a visible fall and overloaded Team", async () => {
    await createAnsweredPulse([10, 10, 10, 10], new Date("2026-04-01T09:00:00Z"));
    await createAnsweredPulse([10, 10, 0, 0], new Date("2026-07-01T09:00:00Z"));

    const analysis = await analyzeTeamEnps(
      { actorClerkUserId: "correlation_direction", teamId },
      db.prisma,
    );
    expect(analysis).toEqual({
      teamId,
      correlations: [
        {
          type: "enps_drop_with_over_capacity",
          relationship: "coincidence",
          enpsChange: { type: "integer", start: -200, target: 0, current: -100 },
          capacity: { type: "percentage", start: 0, target: 100, current: 120 },
        },
      ],
    });
    expect(JSON.stringify(analysis)).not.toContain("memberId");
    expect(JSON.stringify(analysis)).not.toContain("responseId");
  });

  it("does not alert when the latest visible Team eNPS is stable or rising", async () => {
    await createAnsweredPulse([10, 10, 10, 10], new Date("2026-10-01T09:00:00Z"));

    expect(
      await analyzeTeamEnps({ actorClerkUserId: "correlation_direction", teamId }, db.prisma),
    ).toEqual({ teamId, correlations: [] });
  });
});
