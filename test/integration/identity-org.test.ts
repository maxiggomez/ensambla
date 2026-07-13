import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  changeMemberRole,
  createOrganization,
  inviteMember,
  listMembers,
} from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import { resolveTenantForUser } from "../../src/shared/tenancy";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Use cases of the identity-org capability against real Postgres + RLS
 * (Scenarios ORG-1/ORG-2/ORG-3 of the foundation delta spec).
 */
describe("identity-org use cases", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("ORG-1: creating an organization makes the creator a Dirección member", async () => {
    const { organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "user_ana",
        name: "Org A",
        creatorEmail: "ana@org-a.com",
        creatorName: "Ana",
      },
      db.prisma,
    );

    const members = await withTenant(orgA, (tx) => tx.member.findMany(), db.prisma);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      email: "ana@org-a.com",
      role: "Direccion",
      clerkUserId: "user_ana",
    });

    await expect(resolveTenantForUser("user_ana", db.prisma)).resolves.toBe(orgA);
  });

  it("ORG-1: organizations are isolated from each other 🔒", async () => {
    const { organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "user_diego",
        name: "Org Diego",
        creatorEmail: "diego@diego.com",
        creatorName: "Diego",
      },
      db.prisma,
    );
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_eva",
        name: "Org Eva",
        creatorEmail: "eva@eva.com",
        creatorName: "Eva",
      },
      db.prisma,
    );

    const orgsSeenByA = await withTenant(orgA, (tx) => tx.organization.findMany(), db.prisma);
    expect(orgsSeenByA.map((o) => o.id)).toEqual([orgA]);

    const membersSeenByA = await withTenant(orgA, (tx) => tx.member.findMany(), db.prisma);
    expect(membersSeenByA.every((m) => m.organizationId === orgA)).toBe(true);
    expect(membersSeenByA.some((m) => m.email === "eva@eva.com")).toBe(false);
    expect(orgB).not.toBe(orgA);
  });

  describe("invitations and role management in one organization", () => {
    beforeAll(async () => {
      await createOrganization(
        {
          clerkUserId: "user_flor",
          name: "Org Flor",
          creatorEmail: "flor@flor.com",
          creatorName: "Flor",
        },
        db.prisma,
      );
    });

    it("ORG-2: Dirección invites a member by email with a role", async () => {
      await inviteMember(
        {
          actorClerkUserId: "user_flor",
          email: "bruno@flor.com",
          name: "Bruno",
          role: "Lider",
        },
        db.prisma,
      );

      const members = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      const bruno = members.find((m) => m.email === "bruno@flor.com");
      expect(bruno).toMatchObject({ name: "Bruno", role: "Lider" });
    });

    it("ORG-2: re-inviting the same email does not duplicate (merge)", async () => {
      const before = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      const existing = before.find((m) => m.email === "bruno@flor.com");

      const invited = await inviteMember(
        {
          actorClerkUserId: "user_flor",
          email: " Bruno@FLOR.com ",
          name: "Bruno Otra Vez",
          role: "Colaborador",
        },
        db.prisma,
      );

      const after = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      expect(after).toHaveLength(before.length);
      expect(invited.memberId).toBe(existing?.id);
      // Merge keeps the existing record untouched.
      const bruno = after.find((m) => m.email === "bruno@flor.com");
      expect(bruno).toMatchObject({ name: "Bruno", role: "Lider" });
    });

    it("ORG-3: inviting requires Dirección (Líder and Colaborador are forbidden)", async () => {
      // Link bruno's auth identity and add a linked Colaborador to act with.
      await inviteMember(
        {
          actorClerkUserId: "user_flor",
          email: "carla@flor.com",
          name: "Carla",
          role: "Colaborador",
        },
        db.prisma,
      );
      const orgFlor = await resolveTenantForUser("user_flor", db.prisma);
      await withTenant(
        orgFlor!,
        async (tx) => {
          await tx.member.update({
            where: {
              organizationId_email: { organizationId: orgFlor!, email: "bruno@flor.com" },
            },
            data: { clerkUserId: "user_bruno" },
          });
          await tx.member.update({
            where: {
              organizationId_email: { organizationId: orgFlor!, email: "carla@flor.com" },
            },
            data: { clerkUserId: "user_carla" },
          });
        },
        db.prisma,
      );

      const before = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      for (const actor of ["user_bruno", "user_carla"]) {
        await expect(
          inviteMember(
            {
              actorClerkUserId: actor,
              email: "colado@flor.com",
              name: "Colado",
              role: "Colaborador",
            },
            db.prisma,
          ),
        ).rejects.toMatchObject({ code: "identity-org/forbidden" });
      }
      const after = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      expect(after).toHaveLength(before.length);
    });

    it("ORG-3: changing a member's role requires Dirección", async () => {
      const members = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      const bruno = members.find((m) => m.email === "bruno@flor.com");
      const carla = members.find((m) => m.email === "carla@flor.com");

      // Colaborador cannot manage roles.
      await expect(
        changeMemberRole(
          { actorClerkUserId: "user_carla", memberId: bruno!.id, role: "Colaborador" },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "identity-org/forbidden" });
      let refreshed = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      expect(refreshed.find((m) => m.id === bruno!.id)?.role).toBe("Lider");

      // Dirección can.
      await changeMemberRole(
        { actorClerkUserId: "user_flor", memberId: carla!.id, role: "Lider" },
        db.prisma,
      );
      refreshed = await listMembers({ actorClerkUserId: "user_flor" }, db.prisma);
      expect(refreshed.find((m) => m.id === carla!.id)?.role).toBe("Lider");
    });
  });

  describe("robustness guards (review follow-ups)", () => {
    it("the last Dirección cannot demote themselves (org never left without admin)", async () => {
      await createOrganization(
        {
          clerkUserId: "user_gina",
          name: "Org Gina",
          creatorEmail: "gina@gina.com",
          creatorName: "Gina",
        },
        db.prisma,
      );
      const members = await listMembers({ actorClerkUserId: "user_gina" }, db.prisma);
      const gina = members.find((m) => m.email === "gina@gina.com");

      await expect(
        changeMemberRole(
          { actorClerkUserId: "user_gina", memberId: gina!.id, role: "Colaborador" },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "identity-org/last-direccion" });
      let refreshed = await listMembers({ actorClerkUserId: "user_gina" }, db.prisma);
      expect(refreshed.find((m) => m.id === gina!.id)?.role).toBe("Direccion");

      // With a second Dirección the demotion is allowed.
      await inviteMember(
        {
          actorClerkUserId: "user_gina",
          email: "hugo@gina.com",
          name: "Hugo",
          role: "Direccion",
        },
        db.prisma,
      );
      await changeMemberRole(
        { actorClerkUserId: "user_gina", memberId: gina!.id, role: "Colaborador" },
        db.prisma,
      );
      refreshed = await listMembers({ actorClerkUserId: "user_gina" }, db.prisma);
      expect(refreshed.find((m) => m.id === gina!.id)?.role).toBe("Colaborador");
    });

    it("a user that already belongs to an organization cannot create another one", async () => {
      await expect(
        createOrganization(
          {
            clerkUserId: "user_gina",
            name: "Org Gina 2",
            creatorEmail: "gina@gina.com",
            creatorName: "Gina",
          },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "identity-org/organization-exists" });
    });

    it("changing the role of an unknown member fails with a translated not-found", async () => {
      await createOrganization(
        {
          clerkUserId: "user_ivan",
          name: "Org Ivan",
          creatorEmail: "ivan@ivan.com",
          creatorName: "Ivan",
        },
        db.prisma,
      );
      await expect(
        changeMemberRole(
          {
            actorClerkUserId: "user_ivan",
            memberId: "00000000-0000-4000-8000-000000000000",
            role: "Lider",
          },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "identity-org/member-not-found" });
    });

    it("concurrent invitations for the same email merge instead of failing", async () => {
      const before = await listMembers({ actorClerkUserId: "user_ivan" }, db.prisma);
      const input = {
        actorClerkUserId: "user_ivan",
        email: "concurrente@ivan.com",
        name: "Concurrente",
        role: "Colaborador" as const,
      };
      const [first, second] = await Promise.all([
        inviteMember(input, db.prisma),
        inviteMember(input, db.prisma),
      ]);

      expect(first.memberId).toBe(second.memberId);
      const after = await listMembers({ actorClerkUserId: "user_ivan" }, db.prisma);
      expect(after).toHaveLength(before.length + 1);
    });
  });
});
