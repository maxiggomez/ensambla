import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { memberEmail } from "../domain/member-email";
import { canManageMembers } from "../domain/permissions";
import type { Role } from "../domain/roles";
import { findMemberByEmail, upsertMemberByEmail } from "../infrastructure/member-repo";
import { organizationId } from "../../../shared/ids";

import { forbidden, requireActor } from "./actor";

export interface InviteMemberInput {
  actorClerkUserId: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * ORG-2/ORG-3: Dirección invites a person by email with a role. If a member
 * with the same (normalized) email already exists in the organization, no
 * duplicate is created and the existing record is kept untouched (merge).
 */
export async function inviteMember(
  input: InviteMemberInput,
  client: PrismaClient = prismaClient(),
): Promise<{ memberId: string; created: boolean }> {
  const email = memberEmail(input.email);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageMembers(actor.role)) {
        throw forbidden("invite members");
      }

      const existing = await findMemberByEmail(tx, email);
      if (existing) {
        return { memberId: existing.id, created: false };
      }

      // Upsert atómico sobre la unique (org, email): si una invitación
      // concurrente ganó la carrera, devuelve el registro existente sin
      // tocarlo (merge) en lugar de abortar la transacción con P2002.
      const member = await upsertMemberByEmail(tx, {
        organizationId: organizationId(actor.organizationId),
        email,
        name: input.name.trim(),
        role: input.role,
      });
      return { memberId: member.id, created: true };
    },
    client,
  );
}
