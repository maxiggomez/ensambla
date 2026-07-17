import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { leavesOrgWithoutDireccion } from "../domain/direccion-guard";
import { canManageMembers } from "../domain/permissions";
import type { Role } from "../domain/roles";
import {
  countMembersWithRole,
  findMemberById,
  lockDireccionRows,
  updateMemberRole,
} from "../infrastructure/member-repo";

import { forbidden, requireActor } from "./actor";

export interface ChangeMemberRoleInput {
  actorClerkUserId: string;
  memberId: string;
  role: Role;
}

/** ORG-3: only Dirección manages member roles; the org never loses its last Dirección. */
export async function changeMemberRole(
  input: ChangeMemberRoleInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageMembers(actor.role)) {
        throw forbidden("change member roles");
      }

      // Antes de leer target/count: serializa demociones concurrentes (F.3a 🔒).
      await lockDireccionRows(tx);

      const target = await findMemberById(tx, input.memberId);
      if (!target) {
        throw new ApplicationError(
          "identity-org/member-not-found",
          "The member to update does not exist in this organization",
        );
      }

      const direccionCount = await countMembersWithRole(tx, "Direccion");
      if (leavesOrgWithoutDireccion(target.role, input.role, direccionCount)) {
        throw new ApplicationError(
          "identity-org/last-direccion",
          "The organization must always keep at least one Dirección member",
        );
      }

      await updateMemberRole(tx, input.memberId, input.role);
    },
    client,
  );
}
