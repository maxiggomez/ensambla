import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applyOnboardingTemplate } from "../../src/modules/onboarding-setup/application";
import {
  getOnboardingSetup,
  saveOnboardingCompanyProfile,
  startOnboardingSetup,
} from "../../src/modules/onboarding-setup/application";
import { updateKeyResultValue, updateObjectiveTitle } from "../../src/modules/okrs/application";
import { renameSkill } from "../../src/modules/skills-matrix/application";
import { defineNorthStar } from "../../src/modules/strategy-northstar/application";
import { createTeam, updateTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { createOnboardingFixture, type OnboardingFixture } from "../helpers/onboarding-setup";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("onboarding templates", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  async function pendingReview(prefix: string): Promise<OnboardingFixture> {
    const fixture = await createOnboardingFixture(db.prisma, prefix);
    await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);
    await saveOnboardingCompanyProfile(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        companyType: "Producto",
        industry: "Tecnología",
      },
      db.prisma,
    );
    return fixture;
  }

  async function contentCounts(organizationId: OrganizationId) {
    return withTenant(
      organizationId,
      async (tx) => ({
        teams: await tx.team.count(),
        northStars: await tx.northStar.count(),
        objectives: await tx.objective.count(),
        keyResults: await tx.keyResult.count(),
        skills: await tx.skill.count(),
        auditEvents: await tx.okrAuditEvent.count(),
      }),
      db.prisma,
    );
  }

  it.each(["liderClerkUserId", "colaboradorClerkUserId"] as const)(
    "rejects template application by %s without changing content",
    async (actorKey) => {
      const fixture = await pendingReview(`template_role_${actorKey}`);

      await expect(
        applyOnboardingTemplate(
          { actorClerkUserId: fixture[actorKey], templateKey: "saas-product" },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "onboarding-setup/forbidden" });
      await expect(contentCounts(fixture.organizationId)).resolves.toEqual({
        teams: 0,
        northStars: 0,
        objectives: 0,
        keyResults: 0,
        skills: 0,
        auditEvents: 0,
      });
    },
  );

  it("rejects a non-empty target without overwriting or partially adding content", async () => {
    const fixture = await pendingReview("template_existing");
    await createTeam(
      { actorClerkUserId: fixture.direccionClerkUserId, name: "Equipo existente" },
      db.prisma,
    );

    await expect(
      applyOnboardingTemplate(
        { actorClerkUserId: fixture.direccionClerkUserId, templateKey: "saas-product" },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "onboarding-setup/template-target-not-empty" });
    await expect(contentCounts(fixture.organizationId)).resolves.toEqual({
      teams: 1,
      northStars: 0,
      objectives: 0,
      keyResults: 0,
      skills: 0,
      auditEvents: 0,
    });
    await expect(
      getOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ).resolves.toMatchObject({ status: "Pending", appliedTemplateKey: null });
  });

  it("materializes the complete SaaS blueprint as draft tenant-owned content", async () => {
    const fixture = await pendingReview("template_apply");

    await expect(
      applyOnboardingTemplate(
        { actorClerkUserId: fixture.direccionClerkUserId, templateKey: "saas-product" },
        db.prisma,
      ),
    ).resolves.toMatchObject({ status: "Completed", appliedTemplateKey: "saas-product" });

    await expect(contentCounts(fixture.organizationId)).resolves.toEqual({
      teams: 4,
      northStars: 1,
      objectives: 4,
      keyResults: 4,
      skills: 6,
      auditEvents: 8,
    });
    const content = await withTenant(
      fixture.organizationId,
      async (tx) => ({
        teams: await tx.team.findMany({ orderBy: { createdAt: "asc" } }),
        northStar: await tx.northStar.findUnique({
          where: { organizationId: fixture.organizationId },
        }),
        objectives: await tx.objective.findMany({ include: { keyResults: true } }),
        skills: await tx.skill.findMany(),
      }),
      db.prisma,
    );
    expect(content.teams.map(({ name }) => name)).toEqual([
      "Producto",
      "Growth",
      "Customer Success",
      "Diseño",
    ]);
    expect(content.northStar?.name).toBe("Pymes activas que renuevan y crecen");
    expect(content.objectives.every(({ status }) => status === "Draft")).toBe(true);
    expect(content.objectives.every(({ keyResults }) => keyResults.length > 0)).toBe(true);
    expect(content.skills.map(({ name }) => name).sort()).toEqual(
      ["Discovery", "Data", "Growth", "Customer Operations", "Diseño", "Ingeniería"].sort(),
    );
  });

  it("keeps another tenant empty when applying a template", async () => {
    const fixtureA = await pendingReview("template_tenant_a");
    const fixtureB = await pendingReview("template_tenant_b");

    await applyOnboardingTemplate(
      { actorClerkUserId: fixtureA.direccionClerkUserId, templateKey: "saas-product" },
      db.prisma,
    );

    await expect(contentCounts(fixtureB.organizationId)).resolves.toEqual({
      teams: 0,
      northStars: 0,
      objectives: 0,
      keyResults: 0,
      skills: 0,
      auditEvents: 0,
    });
    await expect(
      getOnboardingSetup({ actorClerkUserId: fixtureB.direccionClerkUserId }, db.prisma),
    ).resolves.toMatchObject({ status: "Pending", appliedTemplateKey: null });
  });

  it("keeps every generated entity editable through its owning capability", async () => {
    const fixture = await pendingReview("template_editable");
    await applyOnboardingTemplate(
      { actorClerkUserId: fixture.direccionClerkUserId, templateKey: "saas-product" },
      db.prisma,
    );
    const ids = await withTenant(
      fixture.organizationId,
      async (tx) => ({
        teamId: (await tx.team.findFirstOrThrow()).id,
        objectiveId: (await tx.objective.findFirstOrThrow()).id,
        keyResultId: (
          await tx.keyResult.findFirstOrThrow({
            where: { measurementType: "Percentage" },
          })
        ).id,
        skillId: (await tx.skill.findFirstOrThrow()).id,
      }),
      db.prisma,
    );

    await updateTeam(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        teamId: ids.teamId,
        name: "Equipo editado",
      },
      db.prisma,
    );
    await defineNorthStar(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        name: "North Star editada",
        measurement: { type: "integer", start: 0, target: 200, current: 10 },
      },
      db.prisma,
    );
    await updateObjectiveTitle(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        objectiveId: ids.objectiveId,
        title: "Objective editado",
      },
      db.prisma,
    );
    await updateKeyResultValue(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        keyResultId: ids.keyResultId,
        value: 10,
      },
      db.prisma,
    );
    await renameSkill(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        skillId: ids.skillId,
        name: "Skill editada",
      },
      db.prisma,
    );

    const edited = await withTenant(
      fixture.organizationId,
      async (tx) => ({
        team: await tx.team.findUniqueOrThrow({ where: { id: ids.teamId } }),
        northStar: await tx.northStar.findUniqueOrThrow({
          where: { organizationId: fixture.organizationId },
        }),
        objective: await tx.objective.findUniqueOrThrow({
          where: { id: ids.objectiveId },
        }),
        keyResult: await tx.keyResult.findUniqueOrThrow({
          where: { id: ids.keyResultId },
        }),
        skill: await tx.skill.findUniqueOrThrow({ where: { id: ids.skillId } }),
      }),
      db.prisma,
    );
    expect(edited.team.name).toBe("Equipo editado");
    expect(edited.northStar.name).toBe("North Star editada");
    expect(edited.objective.title).toBe("Objective editado");
    expect(Number(edited.keyResult.currentValue)).toBe(10);
    expect(edited.skill.name).toBe("Skill editada");
  });

  it("retries the same template without duplicates and rejects another template", async () => {
    const fixture = await pendingReview("template_retry");
    const input = {
      actorClerkUserId: fixture.direccionClerkUserId,
      templateKey: "saas-product" as const,
    };

    await applyOnboardingTemplate(input, db.prisma);
    const firstCounts = await contentCounts(fixture.organizationId);
    await expect(applyOnboardingTemplate(input, db.prisma)).resolves.toMatchObject({
      appliedTemplateKey: "saas-product",
    });
    await expect(contentCounts(fixture.organizationId)).resolves.toEqual(firstCounts);
    await expect(
      applyOnboardingTemplate(
        {
          actorClerkUserId: fixture.direccionClerkUserId,
          templateKey: "services-agency",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "onboarding-setup/template-already-applied" });
  });

  it("serializes two simultaneous confirmations of the same template", async () => {
    const fixture = await pendingReview("template_concurrent_retry");
    const input = {
      actorClerkUserId: fixture.direccionClerkUserId,
      templateKey: "saas-product" as const,
    };

    const results = await Promise.allSettled([
      applyOnboardingTemplate(input, db.prisma),
      applyOnboardingTemplate(input, db.prisma),
    ]);

    expect(results.every(({ status }) => status === "fulfilled")).toBe(true);
    await expect(contentCounts(fixture.organizationId)).resolves.toEqual({
      teams: 4,
      northStars: 1,
      objectives: 4,
      keyResults: 4,
      skills: 6,
      auditEvents: 8,
    });
  });

  it("never mixes a template with a concurrent manual structure creation", async () => {
    const fixture = await pendingReview("template_manual_race");
    const barrierKey = 812_345_678;
    let releaseBarrier: () => void = () => {};
    let confirmBarrierHeld: () => void = () => {};
    const barrierRelease = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });
    const barrierHeld = new Promise<void>((resolve) => {
      confirmBarrierHeld = resolve;
    });

    await db.admin.$executeRawUnsafe(`
      CREATE FUNCTION hold_template_team_insert() RETURNS trigger AS $$
      BEGIN
        IF NEW.organization_id = '${fixture.organizationId}'::uuid AND NEW.name = 'Producto' THEN
          PERFORM pg_advisory_xact_lock(${barrierKey}::bigint);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER hold_template_team_insert
      BEFORE INSERT ON team
      FOR EACH ROW EXECUTE FUNCTION hold_template_team_insert();
    `);

    const barrierHolder = db.admin.$transaction(
      async (tx) => {
        await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock(${barrierKey}::bigint)::text`);
        confirmBarrierHeld();
        await barrierRelease;
      },
      { timeout: 30_000 },
    );
    await barrierHeld;

    const templateApplication = applyOnboardingTemplate(
      { actorClerkUserId: fixture.direccionClerkUserId, templateKey: "saas-product" },
      db.prisma,
    );

    try {
      let templateReachedBarrier = false;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const [lock] = await db.admin.$queryRawUnsafe<Array<{ waiting: number }>>(`
          SELECT count(*)::int AS waiting
          FROM pg_locks
          WHERE locktype = 'advisory'
            AND classid = 0
            AND objid = ${barrierKey}
            AND NOT granted
        `);
        if ((lock?.waiting ?? 0) > 0) {
          templateReachedBarrier = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(templateReachedBarrier).toBe(true);

      await expect(
        createTeam(
          { actorClerkUserId: fixture.direccionClerkUserId, name: "Equipo concurrente" },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "teams-staffing/structure-busy" });

      releaseBarrier();
      await barrierHolder;
      await templateApplication;
    } finally {
      releaseBarrier();
      await Promise.allSettled([barrierHolder, templateApplication]);
      await db.admin.$executeRawUnsafe(`DROP TRIGGER hold_template_team_insert ON team`);
      await db.admin.$executeRawUnsafe(`DROP FUNCTION hold_template_team_insert()`);
    }

    await expect(contentCounts(fixture.organizationId)).resolves.toEqual({
      teams: 4,
      northStars: 1,
      objectives: 4,
      keyResults: 4,
      skills: 6,
      auditEvents: 8,
    });
  });

  it("rolls back every write and setup state when a late materializer fails", async () => {
    const fixture = await pendingReview("template_rollback");
    await db.admin.$executeRawUnsafe(`
      CREATE FUNCTION fail_template_skill_insert() RETURNS trigger AS $$
      BEGIN
        IF NEW.organization_id = '${fixture.organizationId}'::uuid THEN
          RAISE EXCEPTION 'injected late template failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER fail_template_skill_insert
      BEFORE INSERT ON skill
      FOR EACH ROW EXECUTE FUNCTION fail_template_skill_insert();
    `);

    try {
      await expect(
        applyOnboardingTemplate(
          { actorClerkUserId: fixture.direccionClerkUserId, templateKey: "saas-product" },
          db.prisma,
        ),
      ).rejects.toThrow("injected late template failure");
    } finally {
      await db.admin.$executeRawUnsafe(`DROP TRIGGER fail_template_skill_insert ON skill`);
      await db.admin.$executeRawUnsafe(`DROP FUNCTION fail_template_skill_insert()`);
    }

    await expect(contentCounts(fixture.organizationId)).resolves.toEqual({
      teams: 0,
      northStars: 0,
      objectives: 0,
      keyResults: 0,
      skills: 0,
      auditEvents: 0,
    });
    await expect(
      getOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ).resolves.toMatchObject({ status: "Pending", appliedTemplateKey: null });
  });
});
