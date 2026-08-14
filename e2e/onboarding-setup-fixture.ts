import { prismaClient, withTenant } from "../src/shared/db";
import { resolveTenantForUser } from "../src/shared/tenancy";

const ONBOARDING_USER_ID = "dev_onboarding";

async function cleanup(): Promise<void> {
  const client = prismaClient();
  try {
    const organizationId = await resolveTenantForUser(ONBOARDING_USER_ID, client);
    if (!organizationId) return;
    await withTenant(
      organizationId,
      async (tx) => {
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
        objectives: await tx.objective.count(),
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

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action === "cleanup") await cleanup();
  else if (action === "assert-empty") await assertEmpty();
  else throw new Error("Expected onboarding fixture action: cleanup | assert-empty");
}

void main();
