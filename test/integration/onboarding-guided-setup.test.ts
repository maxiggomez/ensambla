import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  backOnboardingSetup,
  completeOnboardingSetup,
  getOnboardingSetup,
  getOnboardingSetupAccess,
  saveOnboardingCompanyProfile,
  skipOnboardingSetup,
  startOnboardingSetup,
} from "../../src/modules/onboarding-setup/application";
import { compareAndSetSetup } from "../../src/modules/onboarding-setup/infrastructure/setup-repo";
import { withTenant } from "../../src/shared/db";
import { createOnboardingFixture } from "../helpers/onboarding-setup";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("onboarding guided setup", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("bootstraps first entry idempotently and resumes the persisted step", async () => {
    const fixture = await createOnboardingFixture(db.prisma, "setup_bootstrap");

    expect(
      await getOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ).toBeNull();

    const first = await startOnboardingSetup(
      { actorClerkUserId: fixture.direccionClerkUserId },
      db.prisma,
    );
    const retry = await startOnboardingSetup(
      { actorClerkUserId: fixture.direccionClerkUserId },
      db.prisma,
    );

    expect(first).toEqual({
      status: "Pending",
      currentStep: "CompanyProfile",
      companyType: null,
      industry: null,
    });
    expect(retry).toEqual(first);
    await expect(
      getOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ).resolves.toEqual(first);
  });

  it("persists profile → review → Back restoration → completion", async () => {
    const fixture = await createOnboardingFixture(db.prisma, "setup_complete");
    await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);

    const review = await saveOnboardingCompanyProfile(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        companyType: "  Servicios  ",
        industry: "  Tecnología  ",
      },
      db.prisma,
    );
    expect(review).toMatchObject({
      status: "Pending",
      currentStep: "Review",
      companyType: "Servicios",
      industry: "Tecnología",
    });

    const restored = await backOnboardingSetup(
      { actorClerkUserId: fixture.direccionClerkUserId },
      db.prisma,
    );
    expect(restored).toMatchObject({
      currentStep: "CompanyProfile",
      companyType: "Servicios",
      industry: "Tecnología",
    });

    await saveOnboardingCompanyProfile(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        companyType: restored.companyType!,
        industry: restored.industry!,
      },
      db.prisma,
    );
    await expect(
      completeOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ).resolves.toMatchObject({ status: "Completed", currentStep: "Review" });

    expect(
      await withTenant(
        fixture.organizationId,
        async (tx) => ({
          teams: await tx.team.count(),
          objectives: await tx.objective.count(),
          skills: await tx.skill.count(),
        }),
        db.prisma,
      ),
    ).toEqual({ teams: 0, objectives: 0, skills: 0 });
  });

  it("allows only one of two stale concurrent completions", async () => {
    const fixture = await createOnboardingFixture(db.prisma, "setup_concurrent");
    await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);
    await saveOnboardingCompanyProfile(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        companyType: "Producto",
        industry: "Tecnología",
      },
      db.prisma,
    );

    const settled = await Promise.allSettled([
      completeOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
      completeOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ]);

    expect(settled.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(settled.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("compare-and-sets one of two identical stale setup snapshots", async () => {
    const fixture = await createOnboardingFixture(db.prisma, "setup_cas");
    await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);
    const expected = await saveOnboardingCompanyProfile(
      {
        actorClerkUserId: fixture.direccionClerkUserId,
        companyType: "Producto",
        industry: "Tecnología",
      },
      db.prisma,
    );

    const changed = await Promise.all([
      withTenant(
        fixture.organizationId,
        (tx) =>
          compareAndSetSetup(tx, fixture.organizationId, expected, {
            ...expected,
            status: "Completed",
          }),
        db.prisma,
      ),
      withTenant(
        fixture.organizationId,
        (tx) =>
          compareAndSetSetup(tx, fixture.organizationId, expected, {
            ...expected,
            currentStep: "CompanyProfile",
          }),
        db.prisma,
      ),
    ]);

    expect(changed.filter(Boolean)).toHaveLength(1);
  });

  it("skips to an empty configurable application", async () => {
    const fixture = await createOnboardingFixture(db.prisma, "setup_skip");
    await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);

    await expect(
      skipOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma),
    ).resolves.toEqual({
      status: "Skipped",
      currentStep: "CompanyProfile",
      companyType: null,
      industry: null,
    });

    expect(
      await withTenant(
        fixture.organizationId,
        async (tx) => ({
          teams: await tx.team.count(),
          objectives: await tx.objective.count(),
          skills: await tx.skill.count(),
        }),
        db.prisma,
      ),
    ).toEqual({ teams: 0, objectives: 0, skills: 0 });
  });

  it.each(["liderClerkUserId", "colaboradorClerkUserId"] as const)(
    "rejects every mutation by %s",
    async (actorKey) => {
      const fixture = await createOnboardingFixture(db.prisma, `setup_role_${actorKey}`);
      await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);
      const actorClerkUserId = fixture[actorKey];

      const mutations = [
        () => startOnboardingSetup({ actorClerkUserId }, db.prisma),
        () =>
          saveOnboardingCompanyProfile(
            { actorClerkUserId, companyType: "Producto", industry: "Finanzas" },
            db.prisma,
          ),
        () => backOnboardingSetup({ actorClerkUserId }, db.prisma),
        () => completeOnboardingSetup({ actorClerkUserId }, db.prisma),
        () => skipOnboardingSetup({ actorClerkUserId }, db.prisma),
      ];

      for (const mutation of mutations) {
        await expect(mutation()).rejects.toMatchObject({ code: "onboarding-setup/forbidden" });
      }
    },
  );

  it("projects pending setup without mutation access to non-Dirección", async () => {
    const fixture = await createOnboardingFixture(db.prisma, "setup_access");
    await startOnboardingSetup({ actorClerkUserId: fixture.direccionClerkUserId }, db.prisma);

    await expect(
      getOnboardingSetupAccess({ actorClerkUserId: fixture.liderClerkUserId }, db.prisma),
    ).resolves.toEqual({
      canMutate: false,
      setup: {
        status: "Pending",
        currentStep: "CompanyProfile",
        companyType: null,
        industry: null,
      },
    });
  });

  it("isolates setup progress and profile data by Organization", async () => {
    const fixtureA = await createOnboardingFixture(db.prisma, "setup_tenant_a");
    const fixtureB = await createOnboardingFixture(db.prisma, "setup_tenant_b");
    await startOnboardingSetup({ actorClerkUserId: fixtureA.direccionClerkUserId }, db.prisma);
    await startOnboardingSetup({ actorClerkUserId: fixtureB.direccionClerkUserId }, db.prisma);
    await saveOnboardingCompanyProfile(
      {
        actorClerkUserId: fixtureA.direccionClerkUserId,
        companyType: "Org A privada",
        industry: "Industria A",
      },
      db.prisma,
    );

    await expect(
      getOnboardingSetup({ actorClerkUserId: fixtureB.direccionClerkUserId }, db.prisma),
    ).resolves.toEqual({
      status: "Pending",
      currentStep: "CompanyProfile",
      companyType: null,
      industry: null,
    });
    expect(
      await withTenant(
        fixtureB.organizationId,
        (tx) => tx.onboardingSetup.findMany(),
        db.prisma,
      ),
    ).toHaveLength(1);
  });
});
