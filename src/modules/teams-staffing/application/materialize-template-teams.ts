import { randomUUID } from "node:crypto";

import type { TenantClient } from "../../../shared/db";
import type { OrganizationId } from "../../../shared/ids";
import { teamName } from "../domain/team";
import { countTeams, insertTeam } from "../infrastructure/team-repo";

export async function isTemplateTeamTargetEmpty(tx: TenantClient): Promise<boolean> {
  return (await countTeams(tx)) === 0;
}

export async function materializeTemplateTeams(
  tx: TenantClient,
  organizationId: OrganizationId,
  names: readonly string[],
): Promise<void> {
  const validatedNames = names.map(teamName);
  for (const name of validatedNames) {
    await insertTeam(tx, {
      id: randomUUID(),
      organizationId,
      name,
      description: null,
    });
  }
}
