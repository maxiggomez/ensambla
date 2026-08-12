import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { createObjective } from "../../src/modules/okrs/application";
import { createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

import {
  countResolvedBlockers,
  listOpenBlockers,
  recordBlocker,
  resolveBlocker,
} from "../../src/modules/rituals/application";

/**
 * Blockers (change rituals): registro con owner + fecha, vínculo opcional a
 * Objective (validado vía okrs/application) y resolución que sale de la lista
 * de abiertos y cuenta en la métrica de resueltos. Aislamiento por tenant 🔒.
 */
describe("rituals blockers", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let anaMemberId: string;
  let teamId: string;

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
    anaMemberId = (await withTenant(orgA, (tx) => tx.member.findFirstOrThrow(), db.prisma)).id;

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

    const { teamId: id } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Producto" },
      db.prisma,
    );
    teamId = id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("records a blocker with an owner and a creation date (Scenario: Record a blocker)", async () => {
    const { blockerId } = await recordBlocker(
      {
        actorClerkUserId: "user_ana",
        teamId,
        title: "  Dependencia de proveedor  ",
        description: "Sin acceso a la API",
      },
      db.prisma,
    );

    const stored = await withTenant(
      orgA,
      (tx) => tx.blocker.findUniqueOrThrow({ where: { id: blockerId } }),
      db.prisma,
    );
    expect(stored).toMatchObject({
      memberId: anaMemberId,
      title: "Dependencia de proveedor",
      description: "Sin acceso a la API",
      status: "Open",
      objectiveId: null,
    });
    expect(stored.createdAt).toBeInstanceOf(Date);
  });

  it("links a blocker to an objective and shows it associated (Scenario: Blocker linked to an objective)", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Cumplir con el sprint",
        level: "Team",
        teamId,
        ownerMemberId: anaMemberId,
      },
      db.prisma,
    );
    const { blockerId } = await recordBlocker(
      {
        actorClerkUserId: "user_ana",
        teamId,
        title: "Regresión en login",
        objectiveId,
      },
      db.prisma,
    );

    const open = await listOpenBlockers({ actorClerkUserId: "user_ana" }, db.prisma);
    const blocker = open.find((b) => b.blockerId === blockerId);
    expect(blocker).toMatchObject({
      objective: { id: objectiveId, title: "Cumplir con el sprint" },
    });
  });

  it("resolves a blocker: leaves the open list and counts in the resolved metric (Scenario: Resolve a blocker)", async () => {
    const { blockerId } = await recordBlocker(
      { actorClerkUserId: "user_ana", teamId, title: "Deuda técnica" },
      db.prisma,
    );
    await resolveBlocker({ actorClerkUserId: "user_ana", blockerId }, db.prisma);

    const openIds = (await listOpenBlockers({ actorClerkUserId: "user_ana" }, db.prisma)).map(
      (b) => b.blockerId,
    );
    expect(openIds).not.toContain(blockerId);
    expect(await countResolvedBlockers({ actorClerkUserId: "user_ana" }, db.prisma)).toBe(1);
  });

  it("Colaborador cannot record a blocker", async () => {
    await expect(
      recordBlocker(
        { actorClerkUserId: "user_carla", teamId, title: "No autorizado" },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "rituals/forbidden" });
  });

  it("blockers are tenant-isolated 🔒", async () => {
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );
    const { teamId: teamB } = await createTeam(
      { actorClerkUserId: "user_bob", name: "Equipo B" },
      db.prisma,
    );
    await recordBlocker(
      { actorClerkUserId: "user_bob", teamId: teamB, title: "Bloqueo de Org B" },
      db.prisma,
    );

    expect(await withTenant(orgB, (tx) => tx.blocker.findMany(), db.prisma)).toHaveLength(1);
    const anaOpen = await listOpenBlockers({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(anaOpen).not.toContainEqual(expect.objectContaining({ title: "Bloqueo de Org B" }));
    expect(await countResolvedBlockers({ actorClerkUserId: "user_bob" }, db.prisma)).toBe(0);
  });
});
