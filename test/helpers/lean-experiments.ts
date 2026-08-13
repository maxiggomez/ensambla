import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  publishObjective,
} from "../../src/modules/okrs/application";
import { withTenant, type PrismaClient } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";

export interface LeanFixture {
  actorClerkUserId: string;
  organizationId: OrganizationId;
  memberId: string;
  objectiveId: string;
  keyResultId: string;
}

export async function createLeanFixture(
  client: PrismaClient,
  suffix: string,
): Promise<LeanFixture> {
  const actorClerkUserId = `lean_${suffix}`;
  const { organizationId } = await createOrganization(
    {
      clerkUserId: actorClerkUserId,
      name: `Lean ${suffix}`,
      creatorEmail: `${suffix}@lean.test`,
      creatorName: `Direction ${suffix}`,
    },
    client,
  );
  const member = await withTenant(
    organizationId,
    (tx) => tx.member.findFirstOrThrow({ where: { clerkUserId: actorClerkUserId } }),
    client,
  );
  const { objectiveId } = await createObjective(
    {
      actorClerkUserId,
      title: `Objective ${suffix}`,
      level: "Company",
      ownerMemberId: member.id,
    },
    client,
  );
  const { keyResultId } = await addKeyResult(
    {
      actorClerkUserId,
      objectiveId,
      title: `KeyResult ${suffix}`,
      measurementType: "percentage",
      startValue: 0,
      targetValue: 50,
    },
    client,
  );
  await publishObjective({ actorClerkUserId, objectiveId }, client);
  return { actorClerkUserId, organizationId, memberId: member.id, objectiveId, keyResultId };
}
