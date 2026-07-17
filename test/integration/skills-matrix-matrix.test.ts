import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  defineSkill,
  getCompetencyMatrix,
  setCompetency,
} from "../../src/modules/skills-matrix/application";
import { assignTeamMember, createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Matriz de competencias (change skills-matrix-core): Skill por org,
 * Competency Member+Skill+Level 0–4 con upsert, matriz filtrable por Team.
 * Tablas nuevas aisladas por tenant (🔒).
 */
describe("skills-matrix competency matrix", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let carlaMemberId: string;
  let daniMemberId: string;

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
    for (const [email, name, clerkUserId, capture] of [
      ["carla@org-a.com", "Carla", "user_carla", "carla"],
      ["dani@org-a.com", "Dani", "user_dani", "dani"],
    ] as const) {
      const { memberId } = await inviteMember(
        { actorClerkUserId: "user_ana", email, name, role: "Colaborador" },
        db.prisma,
      );
      if (capture === "carla") carlaMemberId = memberId;
      else daniMemberId = memberId;
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

  it("records a competency and setting it again replaces the level", async () => {
    const { skillId } = await defineSkill(
      { actorClerkUserId: "user_ana", name: "  TypeScript  " },
      db.prisma,
    );
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: carlaMemberId, skillId, level: 3 },
      db.prisma,
    );
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: carlaMemberId, skillId, level: 4 },
      db.prisma,
    );

    const rows = await withTenant(
      orgA,
      (tx) => tx.competency.findMany({ where: { skillId } }),
      db.prisma,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ memberId: carlaMemberId, level: 4 });
  });

  it("rejects an out-of-range level", async () => {
    const { skillId } = await defineSkill(
      { actorClerkUserId: "user_ana", name: "Ventas" },
      db.prisma,
    );
    await expect(
      setCompetency(
        { actorClerkUserId: "user_ana", memberId: carlaMemberId, skillId, level: 7 },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "skills-matrix/invalid-level" });
  });

  it("Colaborador cannot define skills", async () => {
    await expect(
      defineSkill({ actorClerkUserId: "user_carla", name: "Sombra" }, db.prisma),
    ).rejects.toMatchObject({ code: "skills-matrix/forbidden" });
  });

  it("shows the matrix filtered by team (only that team's members)", async () => {
    const { skillId } = await defineSkill(
      { actorClerkUserId: "user_ana", name: "React" },
      db.prisma,
    );
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: carlaMemberId, skillId, level: 2 },
      db.prisma,
    );
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: daniMemberId, skillId, level: 3 },
      db.prisma,
    );

    const { teamId } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Producto" },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId,
        memberId: carlaMemberId,
        role: "Contributor",
        capacityPercent: 50,
      },
      db.prisma,
    );

    const matrix = await getCompetencyMatrix(
      { actorClerkUserId: "user_carla", teamId },
      db.prisma,
    );
    expect(matrix.rows.map((row) => row.memberId)).toEqual([carlaMemberId]);
    expect(matrix.rows[0]?.levels[skillId]).toBe(2);
    expect(matrix.skills.map((skill) => skill.skillId)).toContain(skillId);
  });

  it("skills and competencies are tenant-isolated 🔒", async () => {
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );
    expect(await withTenant(orgB, (tx) => tx.skill.findMany(), db.prisma)).toEqual([]);
    expect(await withTenant(orgB, (tx) => tx.competency.findMany(), db.prisma)).toEqual([]);
  });
});
