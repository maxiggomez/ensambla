import type { OrganizationId } from "../ids";

import type { TenantClient } from "./with-tenant";

/**
 * Non-blocking transaction lock shared by every command that creates the
 * Organization's initial operating structure. The loser fails closed instead
 * of racing an onboarding template preflight.
 */
export async function tryAcquireOrganizationStructureLock(
  tx: TenantClient,
  organizationId: OrganizationId,
): Promise<boolean> {
  const [row] = await tx.$queryRaw<Array<{ acquired: boolean }>>`
    SELECT pg_try_advisory_xact_lock(
      hashtextextended(${`ensambla:organization-structure:${organizationId}`}, 0)
    ) AS acquired
  `;
  return row?.acquired === true;
}

export async function acquireOrganizationStructureLock(
  tx: TenantClient,
  organizationId: OrganizationId,
): Promise<void> {
  await tx.$queryRaw<Array<{ acquired: string | null }>>`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${`ensambla:organization-structure:${organizationId}`}, 0)
    )::text AS acquired
  `;
}
