import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { withTenant, type PrismaClient } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";

export interface OnboardingFixture {
  organizationId: OrganizationId;
  direccionClerkUserId: string;
  liderClerkUserId: string;
  colaboradorClerkUserId: string;
}

export async function createOnboardingFixture(
  prisma: PrismaClient,
  prefix: string,
): Promise<OnboardingFixture> {
  const direccionClerkUserId = `${prefix}_direccion`;
  const liderClerkUserId = `${prefix}_lider`;
  const colaboradorClerkUserId = `${prefix}_colaborador`;
  const { organizationId } = await createOrganization(
    {
      clerkUserId: direccionClerkUserId,
      name: `Onboarding ${prefix}`,
      creatorEmail: `${prefix}.direccion@onboarding.test`,
      creatorName: `Dirección ${prefix}`,
    },
    prisma,
  );

  for (const member of [
    {
      clerkUserId: liderClerkUserId,
      email: `${prefix}.lider@onboarding.test`,
      role: "Lider" as const,
    },
    {
      clerkUserId: colaboradorClerkUserId,
      email: `${prefix}.colaborador@onboarding.test`,
      role: "Colaborador" as const,
    },
  ]) {
    const invited = await inviteMember(
      {
        actorClerkUserId: direccionClerkUserId,
        email: member.email,
        name: member.clerkUserId,
        role: member.role,
      },
      prisma,
    );
    await withTenant(
      organizationId,
      (tx) =>
        tx.member.update({
          where: { id: invited.memberId },
          data: { clerkUserId: member.clerkUserId },
        }),
      prisma,
    );
  }

  return {
    organizationId,
    direccionClerkUserId,
    liderClerkUserId,
    colaboradorClerkUserId,
  };
}
