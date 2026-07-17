import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { memberEmail } from "../domain/member-email";
import { memberName } from "../domain/member-name";
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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
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
  try {
    return await runInvite(input, client);
  } catch (error) {
    // Carrera entre invitaciones concurrentes: dentro de una transacción
    // interactiva Postgres aborta todo ante la unique violation, así que el
    // merge debe reintentarse en una transacción NUEVA, donde el lookup por
    // email encuentra al ganador.
    if (isUniqueViolation(error)) {
      return runInvite(input, client);
    }
    throw error;
  }
}

async function runInvite(
  input: InviteMemberInput,
  client: PrismaClient,
): Promise<{ memberId: string; created: boolean }> {
  const email = memberEmail(input.email);
  const name = memberName(input.name);

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

      const member = await upsertMemberByEmail(tx, {
        organizationId: organizationId(actor.organizationId),
        email,
        name,
        role: input.role,
      });
      return { memberId: member.id, created: true };
    },
    client,
  );
}
