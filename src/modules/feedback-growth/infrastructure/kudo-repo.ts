import type { TenantClient } from "../../../shared/db";

export interface InsertKudoInput {
  id: string;
  organizationId: string;
  giverId: string;
  recipientId: string;
  message: string;
  value: string;
  objectiveId: string | null;
  objectiveTitleSnapshot: string | null;
  keyResultId: string | null;
  keyResultTitleSnapshot: string | null;
}

export function insertKudo(tx: TenantClient, input: InsertKudoInput): Promise<unknown> {
  return tx.kudo.create({ data: input });
}

export function listKudos(tx: TenantClient) {
  return tx.kudo.findMany({
    select: {
      id: true,
      giverId: true,
      recipientId: true,
      message: true,
      value: true,
      objectiveId: true,
      objectiveTitleSnapshot: true,
      keyResultId: true,
      keyResultTitleSnapshot: true,
      keyResult: { select: { objectiveId: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
