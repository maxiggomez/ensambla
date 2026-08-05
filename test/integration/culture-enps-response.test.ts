import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  launchPulse,
  listPendingPulses,
  submitPulseResponse,
} from "../../src/modules/culture-enps/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("anonymous immutable PulseResponse 🔒", () => {
  let db: TestDatabase;
  let orgId: OrganizationId;
  let memberId: string;
  let pulseId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgId } = await createOrganization(
      {
        clerkUserId: "response_direction",
        name: "Response Org",
        creatorEmail: "direction@response.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    ({ memberId } = await inviteMember(
      {
        actorClerkUserId: "response_direction",
        email: "person@response.test",
        name: "Persona",
        role: "Colaborador",
      },
      db.prisma,
    ));
    await withTenant(
      orgId,
      (tx) =>
        tx.member.update({ where: { id: memberId }, data: { clerkUserId: "response_person" } }),
      db.prisma,
    );
    ({ pulseId } = await launchPulse(
      { actorClerkUserId: "response_direction", scope: { type: "organization" } },
      db.prisma,
    ));
  });

  afterAll(async () => {
    await db.stop();
  });

  it("lists a recipient's pending pulse without exposing responses", async () => {
    expect(await listPendingPulses({ actorClerkUserId: "response_person" }, db.prisma)).toEqual(
      [{ pulseId, scope: { type: "organization" } }],
    );
  });

  it("claims participation and stores a typed response with no identity link", async () => {
    const result = await submitPulseResponse(
      {
        actorClerkUserId: "response_person",
        pulseId,
        score: 9,
        driver: "Recognition",
        comment: "  Me siento reconocido  ",
      },
      db.prisma,
    );

    expect(result).toEqual({ submitted: true });
    expect(result).not.toHaveProperty("responseId");
    const stored = await withTenant(
      orgId,
      async (tx) => ({
        participation: await tx.pulseParticipation.findUniqueOrThrow({
          where: { pulseId_memberId: { pulseId, memberId } },
        }),
        responses: await tx.pulseResponse.findMany({ where: { pulseId } }),
      }),
      db.prisma,
    );
    expect(stored.participation.responded).toBe(true);
    expect(stored.responses).toHaveLength(1);
    expect(stored.responses[0]).toMatchObject({
      organizationId: orgId,
      pulseId,
      teamId: null,
      measurementType: "Integer",
      driver: "Recognition",
      comment: "Me siento reconocido",
    });
    expect(Number(stored.responses[0]?.startValue)).toBe(0);
    expect(Number(stored.responses[0]?.targetValue)).toBe(10);
    expect(Number(stored.responses[0]?.currentValue)).toBe(9);
    expect(stored.responses[0]).not.toHaveProperty("memberId");
    expect(stored.responses[0]).not.toHaveProperty("participationId");
  });

  it("rejects a second submission and leaves the immutable response unchanged", async () => {
    await expect(
      submitPulseResponse(
        {
          actorClerkUserId: "response_person",
          pulseId,
          score: 0,
          driver: "Workload",
          comment: "Intento de cambio",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "culture-enps/already-responded" });

    const responses = await withTenant(
      orgId,
      (tx) => tx.pulseResponse.findMany({ where: { pulseId } }),
      db.prisma,
    );
    expect(responses).toHaveLength(1);
    expect(Number(responses[0]?.currentValue)).toBe(9);
  });
});
