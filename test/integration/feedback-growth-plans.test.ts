import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  addGrowthEvidence,
  defineGrowthPlan,
  getGrowthPlan,
  giveFeedback,
} from "../../src/modules/feedback-growth/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { defineSkill, setCompetency } from "../../src/modules/skills-matrix/application";
import { closeProject, createProject } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("GrowthPlans and evidence", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let brunoId: string;
  let carlaId: string;
  let leadershipId: string;
  let analyticsId: string;
  let foreignSkillId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "growth_ana",
        name: "Growth Org A",
        creatorEmail: "ana@growth-a.test",
        creatorName: "Ana",
      },
      db.prisma,
    ));
    for (const member of [
      { email: "bruno@growth-a.test", name: "Bruno", clerkUserId: "growth_bruno" },
      { email: "carla@growth-a.test", name: "Carla", clerkUserId: "growth_carla" },
    ]) {
      const invited = await inviteMember(
        {
          actorClerkUserId: "growth_ana",
          email: member.email,
          name: member.name,
          role: "Colaborador",
        },
        db.prisma,
      );
      if (member.name === "Bruno") brunoId = invited.memberId;
      else carlaId = invited.memberId;
      await withTenant(
        orgA,
        (tx) =>
          tx.member.update({
            where: { organizationId_email: { organizationId: orgA, email: member.email } },
            data: { clerkUserId: member.clerkUserId },
          }),
        db.prisma,
      );
    }
    ({ skillId: leadershipId } = await defineSkill(
      { actorClerkUserId: "growth_ana", name: "Liderazgo" },
      db.prisma,
    ));
    ({ skillId: analyticsId } = await defineSkill(
      { actorClerkUserId: "growth_ana", name: "Analytics" },
      db.prisma,
    ));
    await setCompetency(
      { actorClerkUserId: "growth_ana", memberId: brunoId, skillId: leadershipId, level: 2 },
      db.prisma,
    );

    const orgB = await createOrganization(
      {
        clerkUserId: "growth_bob",
        name: "Growth Org B",
        creatorEmail: "bob@growth-b.test",
        creatorName: "Bob",
      },
      db.prisma,
    );
    ({ skillId: foreignSkillId } = await defineSkill(
      { actorClerkUserId: "growth_bob", name: "Skill extranjera" },
      db.prisma,
    ));
    expect(orgB.organizationId).not.toBe(orgA);
  });

  afterAll(async () => {
    await db.stop();
  });

  async function defineBrunoPlan(): Promise<string> {
    const result = await defineGrowthPlan(
      {
        actorClerkUserId: "growth_bruno",
        nextMilestone: "Liderar un proyecto end-to-end",
        targets: [
          { skillId: leadershipId, targetLevel: 4 },
          { skillId: analyticsId, targetLevel: 2 },
        ],
      },
      db.prisma,
    );
    return result.growthPlanId;
  }

  it("defines targets and derives milestone, gaps and overall progress", async () => {
    const growthPlanId = await defineBrunoPlan();
    await expect(
      getGrowthPlan({ actorClerkUserId: "growth_bruno" }, db.prisma),
    ).resolves.toMatchObject({
      growthPlanId,
      nextMilestone: "Liderar un proyecto end-to-end",
      progress: 25,
      targets: [
        {
          skillId: leadershipId,
          skillName: "Liderazgo",
          targetLevel: 4,
          currentLevel: 2,
          gap: 2,
        },
        {
          skillId: analyticsId,
          skillName: "Analytics",
          targetLevel: 2,
          currentLevel: 0,
          gap: 2,
        },
      ],
    });
  });

  it("attaches received Feedback once and rejects Feedback for another Member", async () => {
    await defineBrunoPlan();
    const received = await giveFeedback(
      {
        actorClerkUserId: "growth_ana",
        recipientMemberId: brunoId,
        body: "Tu coordinación mejoró mucho",
        classification: "strength",
      },
      db.prisma,
    );
    const forCarla = await giveFeedback(
      {
        actorClerkUserId: "growth_ana",
        recipientMemberId: carlaId,
        body: "Feedback para Carla",
        classification: "improvement",
      },
      db.prisma,
    );
    await addGrowthEvidence(
      { actorClerkUserId: "growth_bruno", source: "feedback", feedbackId: received.feedbackId },
      db.prisma,
    );
    expect(
      (await getGrowthPlan({ actorClerkUserId: "growth_bruno" }, db.prisma))?.evidence,
    ).toContainEqual(
      expect.objectContaining({ source: "feedback", feedbackId: received.feedbackId }),
    );
    await expect(
      addGrowthEvidence(
        {
          actorClerkUserId: "growth_bruno",
          source: "feedback",
          feedbackId: received.feedbackId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/evidence-exists" });
    await expect(
      addGrowthEvidence(
        {
          actorClerkUserId: "growth_bruno",
          source: "feedback",
          feedbackId: forCarla.feedbackId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/evidence-not-eligible" });
  });

  it("attaches only a closed Project", async () => {
    await defineBrunoPlan();
    const closed = await createProject(
      { actorClerkUserId: "growth_ana", name: "Proyecto cerrado" },
      db.prisma,
    );
    const active = await createProject(
      { actorClerkUserId: "growth_ana", name: "Proyecto activo" },
      db.prisma,
    );
    await closeProject(
      { actorClerkUserId: "growth_ana", projectId: closed.projectId },
      db.prisma,
    );
    await addGrowthEvidence(
      { actorClerkUserId: "growth_bruno", source: "project", projectId: closed.projectId },
      db.prisma,
    );
    expect(
      (await getGrowthPlan({ actorClerkUserId: "growth_bruno" }, db.prisma))?.evidence,
    ).toContainEqual(
      expect.objectContaining({
        source: "project",
        projectId: closed.projectId,
        projectName: "Proyecto cerrado",
      }),
    );
    await expect(
      addGrowthEvidence(
        { actorClerkUserId: "growth_bruno", source: "project", projectId: active.projectId },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/evidence-not-eligible" });
  });

  it("rejects target Skills from another Organization without replacing the plan", async () => {
    await defineBrunoPlan();
    await expect(
      defineGrowthPlan(
        {
          actorClerkUserId: "growth_bruno",
          nextMilestone: "No debe persistir",
          targets: [{ skillId: foreignSkillId, targetLevel: 4 }],
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/skill-not-found" });
    expect(
      (await getGrowthPlan({ actorClerkUserId: "growth_bruno" }, db.prisma))?.nextMilestone,
    ).toBe("Liderar un proyecto end-to-end");
  });
});
