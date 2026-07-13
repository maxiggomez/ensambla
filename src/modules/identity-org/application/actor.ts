import type { Member, TenantClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { findMemberByClerkUserId } from "../infrastructure/member-repo";

/** Resolves the acting Member inside the current tenant, or fails. */
export async function requireActor(
  tx: TenantClient,
  actorClerkUserId: string,
): Promise<Member> {
  const actor = await findMemberByClerkUserId(tx, actorClerkUserId);
  if (!actor) {
    throw new ApplicationError(
      "identity-org/actor-not-found",
      "The acting user has no member in this organization",
    );
  }
  return actor;
}

export function forbidden(action: string): ApplicationError {
  return new ApplicationError("identity-org/forbidden", `Role not allowed to ${action}`);
}
