import { randomUUID } from "node:crypto";

import type { Prisma, TenantClient } from "../../../shared/db";

export interface InsertAuditEventInput {
  organizationId: string;
  actorMemberId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function insertAuditEvent(
  tx: TenantClient,
  input: InsertAuditEventInput,
): Promise<void> {
  await tx.okrAuditEvent.create({
    data: {
      id: randomUUID(),
      organizationId: input.organizationId,
      actorMemberId: input.actorMemberId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
    },
  });
}

export function listAuditEvents(tx: TenantClient) {
  return tx.okrAuditEvent.findMany({ orderBy: { createdAt: "asc" } });
}
