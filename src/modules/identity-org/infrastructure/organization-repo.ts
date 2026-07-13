import type { TenantClient } from "../../../shared/db";
import type { OrganizationId } from "../../../shared/ids";

export async function insertOrganization(
  tx: TenantClient,
  data: { id: OrganizationId; name: string },
): Promise<void> {
  await tx.organization.create({ data });
}
