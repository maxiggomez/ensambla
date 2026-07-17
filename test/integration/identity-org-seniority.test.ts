import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createOrganization,
  inviteMember,
  setMemberSeniority,
} from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Seniority del Member (delta identity-org del change skills-matrix-core):
 * opcional, editable solo por Dirección.
 */
describe("identity-org member seniority", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let leoMemberId: string;
  let carlaMemberId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "user_ana",
        name: "Org A",
        creatorEmail: "ana@org-a.com",
        creatorName: "Ana",
      },
      db.prisma,
    ));
    for (const [email, name, role, clerkUserId, capture] of [
      ["leo@org-a.com", "Leo", "Lider", "user_leo", "leo"],
      ["carla@org-a.com", "Carla", "Colaborador", "user_carla", "carla"],
    ] as const) {
      const { memberId } = await inviteMember(
        { actorClerkUserId: "user_ana", email, name, role },
        db.prisma,
      );
      if (capture === "leo") leoMemberId = memberId;
      else carlaMemberId = memberId;
      await withTenant(
        orgA,
        (tx) =>
          tx.member.update({
            where: { organizationId_email: { organizationId: orgA, email } },
            data: { clerkUserId },
          }),
        db.prisma,
      );
    }
  });

  afterAll(async () => {
    await db.stop();
  });

  it("Dirección sets a member's seniority", async () => {
    await setMemberSeniority(
      { actorClerkUserId: "user_ana", memberId: leoMemberId, seniority: "Senior" },
      db.prisma,
    );

    const leo = await withTenant(
      orgA,
      (tx) => tx.member.findUniqueOrThrow({ where: { id: leoMemberId } }),
      db.prisma,
    );
    expect(leo.seniority).toBe("Senior");
  });

  it("Líder and Colaborador cannot set seniority", async () => {
    for (const actorClerkUserId of ["user_leo", "user_carla"]) {
      await expect(
        setMemberSeniority(
          { actorClerkUserId, memberId: carlaMemberId, seniority: "Junior" },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "identity-org/forbidden" });
    }
  });
});
