import { prismaClient, type PrismaClient } from "../db";
import type { OrganizationId } from "../ids";

import { resolveTenantForUser } from "./resolve-tenant";

/**
 * F.1 (🔒): links every unlinked membership whose email matches the user's
 * VERIFIED email (as reported by the auth provider — never user input).
 * Runs under the `member_email_self_link_update` RLS policy: only unlinked
 * rows of that email are visible, and the WITH CHECK only accepts writing the
 * session's own clerk id. Returns the number of memberships linked.
 */
export async function linkMembershipsForUser(
  clerkUserId: string,
  verifiedEmail: string,
  client: PrismaClient = prismaClient(),
): Promise<number> {
  const email = verifiedEmail.trim().toLowerCase();
  if (email.length === 0) {
    return 0;
  }
  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user', ${clerkUserId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user_email', ${email}, true)`;
    return tx.$executeRaw`
      UPDATE "member" SET clerk_user_id = ${clerkUserId}
      WHERE email = ${email} AND clerk_user_id IS NULL
    `;
  });
}

/**
 * Per-request resolution for an authenticated user: resolve the tenant and,
 * on a miss (typical first login of an invited person), try to link their
 * memberships by verified email and resolve again.
 */
export async function resolveOrLinkTenantForUser(
  clerkUserId: string,
  verifiedEmail: string,
  client: PrismaClient = prismaClient(),
): Promise<OrganizationId | null> {
  const resolved = await resolveTenantForUser(clerkUserId, client);
  if (resolved !== null) {
    return resolved;
  }
  const linked = await linkMembershipsForUser(clerkUserId, verifiedEmail, client);
  if (linked === 0) {
    return null;
  }
  return resolveTenantForUser(clerkUserId, client);
}
