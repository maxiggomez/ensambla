import type { TenantClient } from "../../../shared/db";
import type { OrganizationId } from "../../../shared/ids";
import { measurementToColumns, type Measurement } from "../../../shared/measurement";
import { northStar } from "../domain/north-star";
import { countNorthStars, upsertNorthStar } from "../infrastructure/north-star-repo";

export async function isTemplateNorthStarTargetEmpty(tx: TenantClient): Promise<boolean> {
  return (await countNorthStars(tx)) === 0;
}

export async function materializeTemplateNorthStar(
  tx: TenantClient,
  organizationId: OrganizationId,
  input: { readonly name: string; readonly measurement: Measurement },
): Promise<void> {
  const definition = northStar(input);
  await upsertNorthStar(tx, {
    organizationId,
    name: definition.name,
    columns: measurementToColumns(definition.measurement),
  });
}
