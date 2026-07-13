import type { Member, TenantClient } from "../../../shared/db";
import type { OrganizationId } from "../../../shared/ids";
import type { Role } from "../domain/roles";

export async function findMemberByClerkUserId(
  tx: TenantClient,
  clerkUserId: string,
): Promise<Member | null> {
  return tx.member.findFirst({ where: { clerkUserId } });
}

export async function findMemberByEmail(
  tx: TenantClient,
  email: string,
): Promise<Member | null> {
  return tx.member.findFirst({ where: { email } });
}

export async function insertMember(
  tx: TenantClient,
  data: {
    organizationId: OrganizationId;
    email: string;
    name: string;
    role: Role;
    clerkUserId?: string;
  },
): Promise<Member> {
  return tx.member.create({ data });
}

/**
 * Atomic create-or-keep on the (organizationId, email) unique key: if a
 * concurrent invitation already created the member, the existing record is
 * returned untouched (`update: {}`) — merge semantics without a failed
 * INSERT aborting the surrounding transaction.
 */
export async function upsertMemberByEmail(
  tx: TenantClient,
  data: {
    organizationId: OrganizationId;
    email: string;
    name: string;
    role: Role;
  },
): Promise<Member> {
  return tx.member.upsert({
    where: {
      organizationId_email: { organizationId: data.organizationId, email: data.email },
    },
    update: {},
    create: data,
  });
}

export async function findMemberById(
  tx: TenantClient,
  memberId: string,
): Promise<Member | null> {
  return tx.member.findUnique({ where: { id: memberId } });
}

export async function countMembersWithRole(tx: TenantClient, role: Role): Promise<number> {
  return tx.member.count({ where: { role } });
}

export async function listAllMembers(tx: TenantClient): Promise<Member[]> {
  return tx.member.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
}

export async function updateMemberRole(
  tx: TenantClient,
  memberId: string,
  role: Role,
): Promise<void> {
  await tx.member.update({ where: { id: memberId }, data: { role } });
}
