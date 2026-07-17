import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { canManageMembers } from "../domain/permissions";
import type { Seniority } from "../domain/seniority";
import { findMemberById, updateMemberSeniority } from "../infrastructure/member-repo";

import { forbidden, requireActor } from "./actor";

export interface SetMemberSeniorityInput {
  actorClerkUserId: string;
  memberId: string;
  seniority: Seniority;
}

/** Solo Dirección registra la seniority de un Member (insumo del staffing). */
export async function setMemberSeniority(
  input: SetMemberSeniorityInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageMembers(actor.role)) {
        throw forbidden("set member seniority");
      }
      const target = await findMemberById(tx, input.memberId);
      if (!target) {
        throw new ApplicationError(
          "identity-org/member-not-found",
          "The member to update does not exist in this organization",
        );
      }
      await updateMemberSeniority(tx, target.id, input.seniority);
    },
    client,
  );
}
