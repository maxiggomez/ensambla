import { prismaClient, withTenant, type PrismaClient, type TenantClient } from "../db";
import { ApplicationError } from "../errors";
import { organizationId, type OrganizationId } from "../ids";

/**
 * Derives the tenant of an authenticated user (Clerk id) from their Member
 * rows. The lookup runs under the `member_self_lookup_select` RLS policy
 * (`app.current_user`), so it only ever sees the user's own memberships —
 * no tenant context needed and no RLS bypass (ADR-0003 🔒).
 *
 * MVP: a user belonging to several organizations resolves to the oldest
 * membership; org switching is deferred.
 */
export async function resolveTenantForUser(
  clerkUserId: string,
  client: PrismaClient = prismaClient(),
): Promise<OrganizationId | null> {
  const membership = await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user', ${clerkUserId}, true)`;
    return tx.member.findFirst({
      where: { clerkUserId },
      // Desempate por id: la resolución multi-org debe ser estable aun con
      // createdAt idénticos.
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { organizationId: true },
    });
  });
  return membership ? organizationId(membership.organizationId) : null;
}

/**
 * Resolves the user's tenant and runs `fn` inside that tenant context
 * (`withTenant`). This is the per-request entry point: handlers derive the
 * Clerk user id from auth and never choose an organization id by hand.
 */
export async function withTenantForUser<T>(
  clerkUserId: string,
  fn: (tx: TenantClient) => Promise<T>,
  client: PrismaClient = prismaClient(),
): Promise<T> {
  const orgId = await resolveTenantForUser(clerkUserId, client);
  if (orgId === null) {
    throw new ApplicationError(
      "tenancy/no-member",
      "The authenticated user has no membership in any organization",
    );
  }
  return withTenant(orgId, fn, client);
}
