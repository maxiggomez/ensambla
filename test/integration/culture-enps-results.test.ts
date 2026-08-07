import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  configureMinimumResponses,
  getEnpsResults,
  launchPulse,
  submitPulseResponse,
} from "../../src/modules/culture-enps/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { assignTeamMember, createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

const PEOPLE = [
  ["results_person_1", "one@results.test"],
  ["results_person_2", "two@results.test"],
  ["results_person_3", "three@results.test"],
  ["results_person_4", "four@results.test"],
  ["results_person_5", "five@results.test"],
] as const;

describe("culture-enps threshold and aggregate results 🔒", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let orgB: OrganizationId;
  let teamId: string;
  const memberIds: string[] = [];

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "results_direction_a",
        name: "Results A",
        creatorEmail: "direction@results-a.test",
        creatorName: "Dirección A",
      },
      db.prisma,
    ));
    for (const [clerkUserId, email] of PEOPLE) {
      const { memberId } = await inviteMember(
        {
          actorClerkUserId: "results_direction_a",
          email,
          name: clerkUserId,
          role: "Colaborador",
        },
        db.prisma,
      );
      memberIds.push(memberId);
      await withTenant(
        orgA,
        (tx) => tx.member.update({ where: { id: memberId }, data: { clerkUserId } }),
        db.prisma,
      );
    }
    ({ teamId } = await createTeam(
      { actorClerkUserId: "results_direction_a", name: "Growth" },
      db.prisma,
    ));
    for (const memberId of memberIds.slice(0, 4)) {
      await assignTeamMember(
        {
          actorClerkUserId: "results_direction_a",
          teamId,
          memberId,
          role: "Contributor",
          capacityPercent: 25,
        },
        db.prisma,
      );
    }
    ({ organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "results_direction_b",
        name: "Results B",
        creatorEmail: "direction@results-b.test",
        creatorName: "Dirección B",
      },
      db.prisma,
    ));
  });

  afterAll(async () => {
    await db.stop();
  });

  it("suppresses every aggregate below default N=4 and reveals it at N=4", async () => {
    const { pulseId } = await launchPulse(
      { actorClerkUserId: "results_direction_a", scope: { type: "organization" } },
      db.prisma,
    );
    const answers = [
      [10, "Recognition", "Se reconocen los logros"],
      [9, "Recognition", "Buen reconocimiento"],
      [8, "Coordination", "Podemos coordinarnos mejor"],
      [0, "Workload", "Demasiados frentes"],
    ] as const;
    for (let index = 0; index < 3; index += 1) {
      const [score, driver, comment] = answers[index]!;
      await submitPulseResponse(
        { actorClerkUserId: PEOPLE[index]![0], pulseId, score, driver, comment },
        db.prisma,
      );
    }

    expect(
      await getEnpsResults({ actorClerkUserId: "results_direction_a", pulseId }, db.prisma),
    ).toEqual({
      pulseId,
      scope: { type: "organization" },
      result: { status: "suppressed", minimumResponses: 4 },
    });

    const [score, driver, comment] = answers[3];
    await submitPulseResponse(
      { actorClerkUserId: PEOPLE[3][0], pulseId, score, driver, comment },
      db.prisma,
    );
    const visible = await getEnpsResults(
      { actorClerkUserId: "results_direction_a", pulseId },
      db.prisma,
    );
    expect(visible).toMatchObject({
      pulseId,
      scope: { type: "organization" },
      result: {
        status: "visible",
        score: { type: "integer", current: 25 },
        participation: { type: "percentage", current: 67 },
        promoters: { current: 50 },
        passives: { current: 25 },
        detractors: { current: 25 },
        drivers: [
          {
            driver: "Recognition",
            count: 2,
            comments: ["Se reconocen los logros", "Buen reconocimiento"],
          },
          {
            driver: "Workload",
            count: 1,
            comments: ["Demasiados frentes"],
          },
          {
            driver: "Coordination",
            count: 1,
            comments: ["Podemos coordinarnos mejor"],
          },
        ],
      },
    });
    expect(JSON.stringify(visible)).not.toContain("memberId");
    expect(JSON.stringify(visible)).not.toContain("responseId");
  });

  it("uses the configured threshold only in its Organization", async () => {
    const { pulseId } = await launchPulse(
      { actorClerkUserId: "results_direction_a", scope: { type: "organization" } },
      db.prisma,
    );
    for (let index = 0; index < 4; index += 1) {
      await submitPulseResponse(
        {
          actorClerkUserId: PEOPLE[index]![0],
          pulseId,
          score: 9,
          driver: "GoalClarity",
        },
        db.prisma,
      );
    }
    await configureMinimumResponses(
      { actorClerkUserId: "results_direction_a", minimumResponses: 5 },
      db.prisma,
    );

    expect(
      await getEnpsResults({ actorClerkUserId: "results_direction_a", pulseId }, db.prisma),
    ).toMatchObject({ result: { status: "suppressed", minimumResponses: 5 } });
    const settings = await Promise.all([
      withTenant(
        orgA,
        (tx) => tx.organization.findUniqueOrThrow({ where: { id: orgA } }),
        db.prisma,
      ),
      withTenant(
        orgB,
        (tx) => tx.organization.findUniqueOrThrow({ where: { id: orgB } }),
        db.prisma,
      ),
    ]);
    expect(settings[0].enpsMinimumResponses).toBe(5);
    expect(settings[1].enpsMinimumResponses).toBe(4);

    await submitPulseResponse(
      {
        actorClerkUserId: PEOPLE[4][0],
        pulseId,
        score: 9,
        driver: "GoalClarity",
      },
      db.prisma,
    );
    expect(
      await getEnpsResults({ actorClerkUserId: "results_direction_a", pulseId }, db.prisma),
    ).toMatchObject({ result: { status: "visible", score: { current: 100 } } });
  });

  it("computes a Team-scoped result and keeps it tenant-isolated", async () => {
    await configureMinimumResponses(
      { actorClerkUserId: "results_direction_a", minimumResponses: 4 },
      db.prisma,
    );
    const { pulseId } = await launchPulse(
      { actorClerkUserId: "results_direction_a", scope: { type: "team", teamId } },
      db.prisma,
    );
    for (let index = 0; index < 4; index += 1) {
      await submitPulseResponse(
        {
          actorClerkUserId: PEOPLE[index]![0],
          pulseId,
          score: index < 2 ? 10 : 0,
          driver: "Workload",
        },
        db.prisma,
      );
    }
    expect(
      await getEnpsResults({ actorClerkUserId: "results_direction_a", pulseId }, db.prisma),
    ).toMatchObject({
      scope: { type: "team", teamId },
      result: { status: "visible", score: { current: 0 } },
    });
    await expect(
      getEnpsResults({ actorClerkUserId: "results_direction_b", pulseId }, db.prisma),
    ).rejects.toMatchObject({ code: "culture-enps/pulse-not-found" });
  });
});
