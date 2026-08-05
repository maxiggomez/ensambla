import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { launchPulse } from "../../src/modules/culture-enps/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { assignTeamMember, createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("culture-enps pulse launch", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let orgB: OrganizationId;
  let teamId: string;
  let collaboratorId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "culture_direction_a",
        name: "Culture A",
        creatorEmail: "direccion@culture-a.test",
        creatorName: "Dirección A",
      },
      db.prisma,
    ));

    for (const member of [
      {
        clerkUserId: "culture_leader_a",
        email: "leader@culture-a.test",
        name: "Líder A",
        role: "Lider" as const,
      },
      {
        clerkUserId: "culture_collaborator_a",
        email: "collab@culture-a.test",
        name: "Colaborador A",
        role: "Colaborador" as const,
      },
    ]) {
      const invited = await inviteMember(
        {
          actorClerkUserId: "culture_direction_a",
          email: member.email,
          name: member.name,
          role: member.role,
        },
        db.prisma,
      );
      await withTenant(
        orgA,
        (tx) =>
          tx.member.update({
            where: { id: invited.memberId },
            data: { clerkUserId: member.clerkUserId },
          }),
        db.prisma,
      );
      if (member.role === "Colaborador") collaboratorId = invited.memberId;
    }

    ({ teamId } = await createTeam(
      { actorClerkUserId: "culture_direction_a", name: "Producto" },
      db.prisma,
    ));
    await assignTeamMember(
      {
        actorClerkUserId: "culture_direction_a",
        teamId,
        memberId: collaboratorId,
        role: "Contributor",
        capacityPercent: 80,
      },
      db.prisma,
    );

    ({ organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "culture_direction_b",
        name: "Culture B",
        creatorEmail: "direccion@culture-b.test",
        creatorName: "Dirección B",
      },
      db.prisma,
    ));
  });

  afterAll(async () => {
    await db.stop();
  });

  it("Dirección launches an Organization pulse delivered to every Member", async () => {
    const launched = await launchPulse(
      { actorClerkUserId: "culture_direction_a", scope: { type: "organization" } },
      db.prisma,
    );

    const stored = await withTenant(
      orgA,
      async (tx) => ({
        pulse: await tx.pulse.findUniqueOrThrow({ where: { id: launched.pulseId } }),
        participations: await tx.pulseParticipation.findMany({
          where: { pulseId: launched.pulseId },
        }),
      }),
      db.prisma,
    );
    expect(stored.pulse).toMatchObject({ scope: "Organization", teamId: null, status: "Open" });
    expect(stored.participations).toHaveLength(3);
    expect(stored.participations.every((row) => row.responded === false)).toBe(true);
  });

  it("Dirección launches a Team pulse only to Members assigned to that Team", async () => {
    const launched = await launchPulse(
      { actorClerkUserId: "culture_direction_a", scope: { type: "team", teamId } },
      db.prisma,
    );

    const participations = await withTenant(
      orgA,
      (tx) => tx.pulseParticipation.findMany({ where: { pulseId: launched.pulseId } }),
      db.prisma,
    );
    expect(participations.map((row) => row.memberId)).toEqual([collaboratorId]);
  });

  it.each(["culture_leader_a", "culture_collaborator_a"])(
    "rejects pulse launch by a non-Dirección actor (%s)",
    async (actorClerkUserId) => {
      await expect(
        launchPulse({ actorClerkUserId, scope: { type: "organization" } }, db.prisma),
      ).rejects.toMatchObject({ code: "culture-enps/forbidden" });
    },
  );

  it("does not expose Organization A pulses or participations to Organization B", async () => {
    expect(await withTenant(orgB, (tx) => tx.pulse.findMany(), db.prisma)).toEqual([]);
    expect(await withTenant(orgB, (tx) => tx.pulseParticipation.findMany(), db.prisma)).toEqual(
      [],
    );
  });
});
