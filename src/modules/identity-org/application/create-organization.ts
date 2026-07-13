import { randomUUID } from "node:crypto";

import { prismaClient, withTenant, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { organizationId, type OrganizationId } from "../../../shared/ids";
import { resolveTenantForUser } from "../../../shared/tenancy";
import { memberEmail } from "../domain/member-email";
import { organizationName } from "../domain/organization-name";
import { insertMember } from "../infrastructure/member-repo";
import { insertOrganization } from "../infrastructure/organization-repo";

export interface CreateOrganizationInput {
  clerkUserId: string;
  name: string;
  creatorEmail: string;
  creatorName: string;
}

/**
 * ORG-1: creates an Organization and its creator as the Dirección member.
 * The id is generated up front so the whole creation runs inside the new
 * tenant's context — the pre-tenant INSERT policy admits the organization row
 * and everything else is regular tenant-scoped RLS.
 */
export async function createOrganization(
  input: CreateOrganizationInput,
  client: PrismaClient = prismaClient(),
): Promise<{ organizationId: OrganizationId }> {
  const name = organizationName(input.name);
  const email = memberEmail(input.creatorEmail);

  // MVP mono-org: un usuario con membership no puede crear otra organización
  // (crearía una org inalcanzable — resolveTenantForUser resuelve la más antigua).
  if ((await resolveTenantForUser(input.clerkUserId, client)) !== null) {
    throw new ApplicationError(
      "identity-org/organization-exists",
      "The user already belongs to an organization",
    );
  }

  const orgId = organizationId(randomUUID());

  await withTenant(
    orgId,
    async (tx) => {
      await insertOrganization(tx, { id: orgId, name });
      await insertMember(tx, {
        organizationId: orgId,
        email,
        name: input.creatorName.trim(),
        role: "Direccion",
        clerkUserId: input.clerkUserId,
      });
    },
    client,
  );

  return { organizationId: orgId };
}
