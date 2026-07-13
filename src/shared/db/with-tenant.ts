import type { OrganizationId } from "../ids";

import { prismaClient } from "./client";
import type { Prisma, PrismaClient } from "./generated/client";

export type TenantClient = Prisma.TransactionClient;

/**
 * Single entry point for tenant-scoped queries (ADR-0003 🔒): opens a
 * transaction and sets the `app.current_org` session variable (local to the
 * transaction) before running `fn`, so the RLS policies filter every query
 * inside it. No repository may query tenant tables without going through it.
 *
 * 🔒 Never set `app.current_user` inside `fn`: RLS policies are permissive
 * (OR-combined) and doing so would additionally expose the user's member rows
 * from OTHER organizations within this tenant's context. The self-lookup
 * policy is only for `resolveTenantForUser`, in its own transaction.
 */
export async function withTenant<T>(
  orgId: OrganizationId,
  fn: (tx: TenantClient) => Promise<T>,
  client: PrismaClient = prismaClient(),
): Promise<T> {
  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_org', ${orgId}, true)`;
    return fn(tx);
  });
}
