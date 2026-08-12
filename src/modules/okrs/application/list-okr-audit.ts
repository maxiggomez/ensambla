import { prismaClient, type Prisma, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canEditOrganization, requireActor } from "../../identity-org/application";
import { listAuditEvents } from "../infrastructure/audit-repo";

export interface OkrAuditEventView {
  id: string;
  actorMemberId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}

export async function listOkrAudit(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<OkrAuditEventView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canEditOrganization(actor.role)) {
        throw new ApplicationError("okrs/forbidden", "Only Dirección can read OKR audit");
      }
      return listAuditEvents(tx);
    },
    client,
  );
}
