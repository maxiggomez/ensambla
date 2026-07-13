import { z } from "zod";

import { DomainError } from "../errors";

/**
 * Branded ID types: at runtime they are plain UUID strings, but the brand
 * makes them non-interchangeable at the type level (an `OrganizationId`
 * cannot be passed where a `MemberId` is expected, nor can a raw string).
 * The only way to obtain one is through its constructor, which validates
 * the UUID format.
 */
declare const brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [brand]: B };

export type OrganizationId = Branded<string, "OrganizationId">;
export type MemberId = Branded<string, "MemberId">;

const uuidSchema = z.uuid();

function parseUuid(value: string, idType: string): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    throw new DomainError("shared/invalid-id", `Invalid ${idType}: expected a UUID`);
  }
  return result.data;
}

export function organizationId(value: string): OrganizationId {
  return parseUuid(value, "OrganizationId") as OrganizationId;
}

export function memberId(value: string): MemberId {
  return parseUuid(value, "MemberId") as MemberId;
}
