import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import {
  linkMembershipsForUser,
  resolveOrLinkTenantForUser,
  resolveTenantForUser,
} from "../../src/shared/tenancy";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * 🔒 F.1 — vinculación del invitado al primer login (change identity-org-hardening).
 * El lookup y el UPDATE pasan por la política RLS `member_email_self_lookup`
 * (email verificado en `app.current_user_email`); nunca por bypass.
 */
describe("member linking on first login 🔒", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    await createOrganization(
      {
        clerkUserId: "user_flor",
        name: "Org Flor",
        creatorEmail: "flor@flor.com",
        creatorName: "Flor",
      },
      db.prisma,
    );
    await inviteMember(
      { actorClerkUserId: "user_flor", email: "bruno@flor.com", name: "Bruno", role: "Lider" },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("links the invited member on first login and resolves their tenant", async () => {
    const orgFlor = await resolveTenantForUser("user_flor", db.prisma);

    const resolved = await resolveOrLinkTenantForUser(
      "user_bruno",
      "bruno@flor.com",
      db.prisma,
    );
    expect(resolved).toBe(orgFlor);

    const bruno = await withTenant(
      orgFlor!,
      (tx) => tx.member.findFirst({ where: { email: "bruno@flor.com" } }),
      db.prisma,
    );
    expect(bruno?.clerkUserId).toBe("user_bruno");
    expect(bruno?.role).toBe("Lider");
  });

  it("does not link when the verified email matches no invitation", async () => {
    const resolved = await resolveOrLinkTenantForUser(
      "user_fantasma",
      "fantasma@otro.com",
      db.prisma,
    );
    expect(resolved).toBeNull();
  });

  it("never relinks a member already linked to another auth identity", async () => {
    // Bruno ya quedó vinculado a user_bruno en el primer test.
    const linked = await linkMembershipsForUser("user_impostor", "bruno@flor.com", db.prisma);
    expect(linked).toBe(0);

    const orgFlor = await resolveTenantForUser("user_flor", db.prisma);
    const bruno = await withTenant(
      orgFlor!,
      (tx) => tx.member.findFirst({ where: { email: "bruno@flor.com" } }),
      db.prisma,
    );
    expect(bruno?.clerkUserId).toBe("user_bruno");
  });

  it("links every unlinked membership for the same email (multi-org invitations)", async () => {
    await createOrganization(
      {
        clerkUserId: "user_gina",
        name: "Org Gina",
        creatorEmail: "gina@gina.com",
        creatorName: "Gina",
      },
      db.prisma,
    );
    await createOrganization(
      {
        clerkUserId: "user_hugo",
        name: "Org Hugo",
        creatorEmail: "hugo@hugo.com",
        creatorName: "Hugo",
      },
      db.prisma,
    );
    await inviteMember(
      {
        actorClerkUserId: "user_gina",
        email: "carla@multi.com",
        name: "Carla",
        role: "Colaborador",
      },
      db.prisma,
    );
    await inviteMember(
      { actorClerkUserId: "user_hugo", email: "carla@multi.com", name: "Carla", role: "Lider" },
      db.prisma,
    );

    const linked = await linkMembershipsForUser("user_carla", "carla@multi.com", db.prisma);
    expect(linked).toBe(2);

    // Resuelve a la membresía más antigua (org de Gina), como define el MVP.
    const orgGina = await resolveTenantForUser("user_gina", db.prisma);
    await expect(resolveTenantForUser("user_carla", db.prisma)).resolves.toBe(orgGina);
  });

  it("the RLS policy rejects linking to a clerk id other than the session's 🔒", async () => {
    await inviteMember(
      {
        actorClerkUserId: "user_flor",
        email: "dani@flor.com",
        name: "Dani",
        role: "Colaborador",
      },
      db.prisma,
    );

    // UPDATE crudo con el contexto de email correcto pero intentando escribir
    // un clerk_user_id AJENO al de la sesión → el WITH CHECK lo rechaza.
    const attempt = db.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user', 'user_dani', true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_email', 'dani@flor.com', true)`;
      return tx.$executeRaw`
        UPDATE "member" SET clerk_user_id = 'user_impostor'
        WHERE email = 'dani@flor.com' AND clerk_user_id IS NULL
      `;
    });
    await expect(attempt).rejects.toThrow();

    const orgFlor = await resolveTenantForUser("user_flor", db.prisma);
    const dani = await withTenant(
      orgFlor!,
      (tx) => tx.member.findFirst({ where: { email: "dani@flor.com" } }),
      db.prisma,
    );
    expect(dani?.clerkUserId).toBeNull();
  });
});
