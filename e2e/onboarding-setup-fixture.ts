import { createPrismaClient, prismaClient, withTenant } from "../src/shared/db";
import { resolveTenantForUser } from "../src/shared/tenancy";

import { DEV_AUTH_ADMIN_URL } from "./dev-auth-setup";

const ONBOARDING_USER_ID = "dev_onboarding";

async function cleanup(): Promise<void> {
  const client = prismaClient();
  try {
    const organizationId = await resolveTenantForUser(ONBOARDING_USER_ID, client);
    if (!organizationId) return;
    const admin = createPrismaClient(DEV_AUTH_ADMIN_URL);
    try {
      await admin.okrAuditEvent.deleteMany({ where: { organizationId } });
    } finally {
      await admin.$disconnect();
    }
    await withTenant(
      organizationId,
      async (tx) => {
        await tx.keyResult.deleteMany({ where: { organizationId } });
        await tx.objective.deleteMany({ where: { organizationId } });
        await tx.team.deleteMany({ where: { organizationId } });
        await tx.skill.deleteMany({ where: { organizationId } });
        await tx.northStar.deleteMany({ where: { organizationId } });
        await tx.onboardingSetup.deleteMany({ where: { organizationId } });
        await tx.member.deleteMany({ where: { clerkUserId: ONBOARDING_USER_ID } });
        await tx.organization.delete({ where: { id: organizationId } });
      },
      client,
    );
  } finally {
    await client.$disconnect();
  }
}

async function assertEmpty(): Promise<void> {
  const client = prismaClient();
  try {
    const organizationId = await resolveTenantForUser(ONBOARDING_USER_ID, client);
    if (!organizationId) throw new Error("Missing onboarding E2E Organization");
    const counts = await withTenant(
      organizationId,
      async (tx) => ({
        teams: await tx.team.count(),
        northStars: await tx.northStar.count(),
        objectives: await tx.objective.count(),
        keyResults: await tx.keyResult.count(),
        skills: await tx.skill.count(),
      }),
      client,
    );
    if (Object.values(counts).some((count) => count !== 0)) {
      throw new Error(`Onboarding fabricated application records: ${JSON.stringify(counts)}`);
    }
  } finally {
    await client.$disconnect();
  }
}

async function assertTemplate(): Promise<void> {
  const client = prismaClient();
  try {
    const organizationId = await resolveTenantForUser(ONBOARDING_USER_ID, client);
    if (!organizationId) throw new Error("Missing onboarding E2E Organization");
    const snapshot = await withTenant(
      organizationId,
      async (tx) => ({
        teams: await tx.team.count(),
        northStars: await tx.northStar.count(),
        objectives: await tx.objective.count(),
        keyResults: await tx.keyResult.count(),
        skills: await tx.skill.count(),
        setup: await tx.onboardingSetup.findUnique({ where: { organizationId } }),
      }),
      client,
    );
    const counts = {
      teams: snapshot.teams,
      northStars: snapshot.northStars,
      objectives: snapshot.objectives,
      keyResults: snapshot.keyResults,
      skills: snapshot.skills,
    };
    const expected = { teams: 4, northStars: 1, objectives: 4, keyResults: 4, skills: 6 };
    if (JSON.stringify(counts) !== JSON.stringify(expected)) {
      throw new Error(`Unexpected template content: ${JSON.stringify(counts)}`);
    }
    if (
      snapshot.setup?.status !== "Completed" ||
      snapshot.setup.appliedTemplateKey !== "saas-product"
    ) {
      throw new Error(`Unexpected template setup state: ${JSON.stringify(snapshot.setup)}`);
    }
  } finally {
    await client.$disconnect();
  }
}

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action === "cleanup") await cleanup();
  else if (action === "assert-empty") await assertEmpty();
  else if (action === "assert-template") await assertTemplate();
  else
    throw new Error(
      "Expected onboarding fixture action: cleanup | assert-empty | assert-template",
    );
}

void main();
