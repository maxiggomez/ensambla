import { z } from "zod";

import { DomainError } from "../../../shared/errors";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/**
 * Canonical member email (ORG-2): trimmed and lowercased, so invitations for
 * the same person always merge into the existing record regardless of casing.
 */
export function memberEmail(raw: string): string {
  const result = emailSchema.safeParse(raw);
  if (!result.success) {
    throw new DomainError("identity-org/invalid-email", `Invalid member email: "${raw}"`);
  }
  return result.data;
}
