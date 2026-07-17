import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  defineNorthStar,
  getNorthStar,
} from "../../src/modules/strategy-northstar/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * North Star (change strategy-okrs-core): Measurement tipado con valor actual
 * y target, única por Organización, definida solo por Dirección y legible por
 * cualquier miembro. Aislada por tenant (ADR-0003 🔒).
 */
describe("strategy-northstar", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;

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

    for (const [email, name, role, clerkUserId] of [
      ["leo@org-a.com", "Leo", "Lider", "user_leo"],
      ["carla@org-a.com", "Carla", "Colaborador", "user_carla"],
    ] as const) {
      await inviteMember({ actorClerkUserId: "user_ana", email, name, role }, db.prisma);
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

  it("Dirección defines the North Star and any member reads it typed", async () => {
    await defineNorthStar(
      {
        actorClerkUserId: "user_ana",
        name: "ARR",
        measurement: { type: "currency", start: 0, target: 1_000_000, current: 250_000 },
      },
      db.prisma,
    );

    const seenByCarla = await getNorthStar({ actorClerkUserId: "user_carla" }, db.prisma);
    expect(seenByCarla).toMatchObject({
      name: "ARR",
      measurement: { type: "currency", start: 0, target: 1_000_000, current: 250_000 },
      progress: 25,
    });
  });

  it("redefining replaces the single North Star", async () => {
    await defineNorthStar(
      {
        actorClerkUserId: "user_ana",
        name: "Clientes activos",
        measurement: { type: "integer", start: 100, target: 500, current: 100 },
      },
      db.prisma,
    );

    const rows = await withTenant(orgA, (tx) => tx.northStar.findMany(), db.prisma);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Clientes activos", measurementType: "Integer" });
  });

  it("Líder and Colaborador cannot define the North Star", async () => {
    for (const actorClerkUserId of ["user_leo", "user_carla"]) {
      await expect(
        defineNorthStar(
          {
            actorClerkUserId,
            name: "Intento no permitido",
            measurement: { type: "check", done: false },
          },
          db.prisma,
        ),
      ).rejects.toMatchObject({ code: "strategy-northstar/forbidden" });
    }
  });

  it("the North Star is tenant-isolated 🔒", async () => {
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );

    await expect(getNorthStar({ actorClerkUserId: "user_bob" }, db.prisma)).resolves.toBeNull();
    const seenByB = await withTenant(orgB, (tx) => tx.northStar.findMany(), db.prisma);
    expect(seenByB).toEqual([]);
  });
});
