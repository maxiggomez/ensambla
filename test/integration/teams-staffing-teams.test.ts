import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  assignTeamMember,
  createTeam,
  listMemberLoads,
  listTeamCapacities,
} from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Teams + membership + capacity (change teams-staffing-core). La capacity es
 * siempre derivada (suma de asignaciones); overloaded > 100. Tablas nuevas
 * aisladas por tenant (ADR-0003 🔒).
 */
describe("teams-staffing teams & capacity", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let leoMemberId: string;
  let carlaMemberId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "user_ana",
        name: "Org A",
        creatorEmail: "ana@org-a.com",
        creatorName: "Ana",
      },
      db.prisma,
    ));

    for (const [email, name, role, clerkUserId, capture] of [
      ["leo@org-a.com", "Leo", "Lider", "user_leo", "leo"],
      ["carla@org-a.com", "Carla", "Colaborador", "user_carla", "carla"],
    ] as const) {
      const { memberId } = await inviteMember(
        { actorClerkUserId: "user_ana", email, name, role },
        db.prisma,
      );
      if (capture === "leo") leoMemberId = memberId;
      else carlaMemberId = memberId;
      await withTenant(
        orgA,
        (tx) =>
          tx.member.update({
            where: { organizationId_email: { organizationId: orgA, email } },
            data: { clerkUserId },
          }),
        db.prisma,
      );
    }
  });

  afterAll(async () => {
    await db.stop();
  });

  it("Dirección creates a team with name and description", async () => {
    const { teamId } = await createTeam(
      {
        actorClerkUserId: "user_ana",
        name: "  Producto  ",
        description: "Equipo de producto",
      },
      db.prisma,
    );

    const stored = await withTenant(
      orgA,
      (tx) => tx.team.findUniqueOrThrow({ where: { id: teamId } }),
      db.prisma,
    );
    expect(stored).toMatchObject({ name: "Producto", description: "Equipo de producto" });
  });

  it("Colaborador cannot create a team", async () => {
    await expect(
      createTeam({ actorClerkUserId: "user_carla", name: "Sombra" }, db.prisma),
    ).rejects.toMatchObject({ code: "teams-staffing/forbidden" });
  });

  it("assigns a member with a team role and capacity percentage", async () => {
    const { teamId } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Ventas" },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId,
        memberId: leoMemberId,
        role: "Lead",
        capacityPercent: 50,
      },
      db.prisma,
    );

    const assignments = await withTenant(
      orgA,
      (tx) => tx.teamMember.findMany({ where: { teamId } }),
      db.prisma,
    );
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatchObject({
      memberId: leoMemberId,
      role: "Lead",
      capacityPercent: 50,
    });
  });

  it("rejects an assignment with capacity outside [0, 100]", async () => {
    const { teamId } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Soporte" },
      db.prisma,
    );
    for (const capacityPercent of [150, -10]) {
      await expect(
        assignTeamMember(
          {
            actorClerkUserId: "user_ana",
            teamId,
            memberId: carlaMemberId,
            role: "Contributor",
            capacityPercent,
          },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "teams-staffing/invalid-capacity" });
    }
  });

  it("derives team capacity and person load with the overloaded flag 🔒 (never stored)", async () => {
    const { teamId: teamX } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Equipo X" },
      db.prisma,
    );
    const { teamId: teamY } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Equipo Y" },
      db.prisma,
    );
    // Carla 60 + 60 entre dos teams → carga 120 (overloaded).
    // Equipo X: 60 (carla) + 50 (leo) = 110 → overloaded; Equipo Y: 60 → no.
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId: teamX,
        memberId: carlaMemberId,
        role: "Contributor",
        capacityPercent: 60,
      },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId: teamX,
        memberId: leoMemberId,
        role: "Lead",
        capacityPercent: 50,
      },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId: teamY,
        memberId: carlaMemberId,
        role: "Contributor",
        capacityPercent: 60,
      },
      db.prisma,
    );

    const capacities = await listTeamCapacities({ actorClerkUserId: "user_carla" }, db.prisma);
    expect(capacities.find((t) => t.teamId === teamX)).toMatchObject({
      capacity: 110,
      overloaded: true,
    });
    expect(capacities.find((t) => t.teamId === teamY)).toMatchObject({
      capacity: 60,
      overloaded: false,
    });

    const loads = await listMemberLoads({ actorClerkUserId: "user_carla" }, db.prisma);
    expect(loads.find((m) => m.memberId === carlaMemberId)).toMatchObject({
      load: 120,
      overloaded: true,
    });
    // Leo: 50 (Ventas, test anterior) + 50 (Equipo X) = 100 exacto → no overload.
    expect(loads.find((m) => m.memberId === leoMemberId)).toMatchObject({
      load: 100,
      overloaded: false,
    });
  });

  it("teams and assignments are tenant-isolated 🔒", async () => {
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );

    expect(await withTenant(orgB, (tx) => tx.team.findMany(), db.prisma)).toEqual([]);
    expect(await withTenant(orgB, (tx) => tx.teamMember.findMany(), db.prisma)).toEqual([]);
    expect(await listTeamCapacities({ actorClerkUserId: "user_bob" }, db.prisma)).toEqual([]);
  });
});
