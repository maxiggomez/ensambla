import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOrganization,
  inviteMember,
  setMemberSeniority,
} from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  publishObjective,
} from "../../src/modules/okrs/application";
import {
  addSkillRequirement,
  defineSkill,
  evaluateGaps,
  setCompetency,
  suggestStaffing,
} from "../../src/modules/skills-matrix/application";
import {
  assignTeamMember,
  createProject,
  createTeam,
} from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Staffing inteligente y gaps (change skills-matrix-core): sugerencias por
 * nivel → seniority → disponibilidad con flag "no margin"; gap de cobertura y
 * bus factor sobre OKRs publicados. Requirements aislados por tenant (🔒).
 */
describe("skills-matrix staffing & gaps", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let anaMemberId: string;
  let leoMemberId: string;
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
    const anaRows = await withTenant(orgA, (tx) => tx.member.findMany(), db.prisma);
    anaMemberId = anaRows[0]!.id;

    for (const [email, name, clerkUserId, capture] of [
      ["leo@org-a.com", "Leo", "user_leo", "leo"],
      ["carla@org-a.com", "Carla", "user_carla", "carla"],
      ["dani@org-a.com", "Dani", "user_dani", "dani"],
    ] as const) {
      const { memberId } = await inviteMember(
        { actorClerkUserId: "user_ana", email, name, role: "Colaborador" },
        db.prisma,
      );
      if (capture === "leo") leoMemberId = memberId;
      else if (capture === "carla") carlaMemberId = memberId;
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

    // Seniority: leo Senior, carla SemiSenior, dani sin dato.
    await setMemberSeniority(
      { actorClerkUserId: "user_ana", memberId: leoMemberId, seniority: "Senior" },
      db.prisma,
    );
    await setMemberSeniority(
      { actorClerkUserId: "user_ana", memberId: carlaMemberId, seniority: "SemiSenior" },
      db.prisma,
    );

    // Cargas: carla 100 (no margin), leo 40, dani 0.
    const { teamId } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Delivery" },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId,
        memberId: carlaMemberId,
        role: "Contributor",
        capacityPercent: 100,
      },
      db.prisma,
    );
    await assignTeamMember(
      {
        actorClerkUserId: "user_ana",
        teamId,
        memberId: leoMemberId,
        role: "Lead",
        capacityPercent: 40,
      },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("suggests people ordered by level → seniority → availability, flagging no margin", async () => {
    const { skillId: reactId } = await defineSkill(
      { actorClerkUserId: "user_ana", name: "React" },
      db.prisma,
    );
    // Niveles: leo 4, carla 4, dani 2; ana sin competencia (no aparece).
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: leoMemberId, skillId: reactId, level: 4 },
      db.prisma,
    );
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: carlaMemberId, skillId: reactId, level: 4 },
      db.prisma,
    );
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: daniMemberId, skillId: reactId, level: 2 },
      db.prisma,
    );

    const { projectId } = await createProject(
      { actorClerkUserId: "user_ana", name: "Rediseño app" },
      db.prisma,
    );
    await addSkillRequirement(
      { actorClerkUserId: "user_ana", skillId: reactId, projectId },
      db.prisma,
    );

    const suggestions = await suggestStaffing(
      { actorClerkUserId: "user_ana", projectId },
      db.prisma,
    );
    // leo y carla nivel 4: gana leo por seniority; dani tercero por nivel 2.
    expect(suggestions.map((s) => s.memberId)).toEqual([
      leoMemberId,
      carlaMemberId,
      daniMemberId,
    ]);
    expect(suggestions.map((s) => s.memberId)).not.toContain(anaMemberId);
    expect(suggestions.find((s) => s.memberId === carlaMemberId)).toMatchObject({
      noMargin: true,
      availability: 0,
    });
    expect(suggestions.find((s) => s.memberId === leoMemberId)).toMatchObject({
      noMargin: false,
      availability: 60,
    });
  });

  it("raises coverage gap and bus factor for a skill required by published OKRs, and clears them", async () => {
    const { skillId: rustId } = await defineSkill(
      { actorClerkUserId: "user_ana", name: "Rust" },
      db.prisma,
    );
    // Solo leo cubre Rust (nivel 3).
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: leoMemberId, skillId: rustId, level: 3 },
      db.prisma,
    );

    // Dos Objectives publicados cuyos KRs requieren Rust.
    for (const title of ["Motor de cálculo", "Migración de core"]) {
      const { objectiveId } = await createObjective(
        { actorClerkUserId: "user_ana", title, level: "Company", ownerMemberId: anaMemberId },
        db.prisma,
      );
      const { keyResultId } = await addKeyResult(
        {
          actorClerkUserId: "user_ana",
          objectiveId,
          title: `KR ${title}`,
          measurementType: "check",
        },
        db.prisma,
      );
      await publishObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma);
      await addSkillRequirement(
        { actorClerkUserId: "user_ana", skillId: rustId, keyResultId },
        db.prisma,
      );
    }

    let gaps = await evaluateGaps({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(gaps.coverageGaps).toContain(rustId);
    expect(gaps.busFactorRisks).toContain(rustId);

    // Una segunda persona con nivel ≥ 3 resuelve el gap y el bus factor.
    await setCompetency(
      { actorClerkUserId: "user_ana", memberId: carlaMemberId, skillId: rustId, level: 3 },
      db.prisma,
    );
    gaps = await evaluateGaps({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(gaps.coverageGaps).not.toContain(rustId);
    expect(gaps.busFactorRisks).not.toContain(rustId);
  });

  it("skill requirements are tenant-isolated 🔒", async () => {
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );
    expect(await withTenant(orgB, (tx) => tx.skillRequirement.findMany(), db.prisma)).toEqual(
      [],
    );
    const gaps = await evaluateGaps({ actorClerkUserId: "user_bob" }, db.prisma);
    expect(gaps.coverageGaps).toEqual([]);
    expect(gaps.busFactorRisks).toEqual([]);
  });
});
