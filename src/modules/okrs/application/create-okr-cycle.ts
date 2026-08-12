import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { validateCycleDates } from "../domain/cycle-close";
import { cycleName } from "../domain/cycle";
import { insertCycle } from "../infrastructure/cycle-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";

export interface CreateOkrCycleInput {
  actorClerkUserId: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
}

export async function createOkrCycle(
  input: CreateOkrCycleInput,
  client: PrismaClient = prismaClient(),
): Promise<{ cycleId: string }> {
  const name = cycleName(input.name);
  const dates = validateCycleDates(input.startsAt, input.endsAt);
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError("okrs/forbidden", "Only Dirección can create OKR cycles");
      }
      const cycleId = randomUUID();
      await insertCycle(tx, {
        id: cycleId,
        organizationId: actor.organizationId,
        name,
        ...dates,
      });
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OKR_CYCLE_CREATED",
        entityType: "OkrCycle",
        entityId: cycleId,
        metadata: { name },
      });
      return { cycleId };
    },
    client,
  );
}
