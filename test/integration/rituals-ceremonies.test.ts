import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

import {
  createRitual,
  evaluateRitualStatus,
  generateRitualOccurrences,
  listRituals,
  markRitualHeld,
} from "../../src/modules/rituals/application";

const at = (iso: string): Date => new Date(iso);

/**
 * Ceremonias recurrentes (change rituals): definir ritual de un Team con
 * cadencia, generar ocurrencias, marcar overdue/held. Tablas nuevas aisladas
 * por tenant (ADR-0003 🔒).
 */
describe("rituals ceremonies", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let teamId: string;
  let teamB: string;

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

    const { teamId: id } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Producto" },
      db.prisma,
    );
    teamId = id;

    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );
    const { teamId: teamBId } = await createTeam(
      { actorClerkUserId: "user_bob", name: "Equipo B" },
      db.prisma,
    );
    teamB = teamBId;
    expect(orgB).toBeTruthy();
  });

  afterAll(async () => {
    await db.stop();
  });

  it("stores a ritual under its Organization and Team (Scenario: Rituals belong to a team of an organization)", async () => {
    const { ritualId } = await createRitual(
      {
        actorClerkUserId: "user_ana",
        teamId,
        name: "  Daily sync  ",
        cadence: "Weekly",
        startDate: at("2026-07-06T00:00:00Z"),
      },
      db.prisma,
    );

    const stored = await withTenant(
      orgA,
      (tx) => tx.ritual.findUniqueOrThrow({ where: { id: ritualId } }),
      db.prisma,
    );
    expect(stored).toMatchObject({
      teamId,
      name: "Daily sync",
      cadence: "Weekly",
    });
  });

  it("generates ritual occurrences from the cadence (Scenario: Generate rituals from cadence)", async () => {
    const { ritualId } = await createRitual(
      {
        actorClerkUserId: "user_ana",
        teamId,
        name: "Review quincenal",
        cadence: "Biweekly",
        startDate: at("2026-07-06T00:00:00Z"),
      },
      db.prisma,
    );

    const { generated } = await generateRitualOccurrences(
      { actorClerkUserId: "user_ana", ritualId, throughDate: at("2026-08-10T00:00:00Z") },
      db.prisma,
    );
    expect(generated).toBe(3);

    const occurrences = await withTenant(
      orgA,
      (tx) =>
        tx.ritualOccurrence.findMany({
          where: { ritualId },
          orderBy: { scheduledDate: "asc" },
        }),
      db.prisma,
    );
    expect(occurrences.map((o) => o.scheduledDate.toISOString().slice(0, 10))).toEqual([
      "2026-07-06",
      "2026-07-20",
      "2026-08-03",
    ]);
    expect(occurrences.every((o) => o.status === "Scheduled")).toBe(true);
  });

  it("generating again does not duplicate occurrences", async () => {
    const { ritualId } = await createRitual(
      {
        actorClerkUserId: "user_ana",
        teamId,
        name: "Sincro diaria",
        cadence: "Weekly",
        startDate: at("2026-07-06T00:00:00Z"),
      },
      db.prisma,
    );
    await generateRitualOccurrences(
      { actorClerkUserId: "user_ana", ritualId, throughDate: at("2026-07-20T00:00:00Z") },
      db.prisma,
    );
    const second = await generateRitualOccurrences(
      { actorClerkUserId: "user_ana", ritualId, throughDate: at("2026-07-20T00:00:00Z") },
      db.prisma,
    );
    expect(second.generated).toBe(0);
  });

  it("marks an occurrence not held on its date as overdue (Scenario: Overdue ritual)", async () => {
    const { ritualId } = await createRitual(
      {
        actorClerkUserId: "user_ana",
        teamId,
        name: "Retro pasada",
        cadence: "Weekly",
        startDate: at("2026-06-01T00:00:00Z"),
      },
      db.prisma,
    );
    await generateRitualOccurrences(
      { actorClerkUserId: "user_ana", ritualId, throughDate: at("2026-06-22T00:00:00Z") },
      db.prisma,
    );

    const { overdue } = await evaluateRitualStatus(
      { actorClerkUserId: "user_ana", ritualId },
      db.prisma,
    );
    expect(overdue).toBe(4);

    const statuses = await withTenant(
      orgA,
      (tx) =>
        tx.ritualOccurrence.findMany({
          where: { ritualId },
          select: { status: true },
        }),
      db.prisma,
    );
    expect(statuses.every((s) => s.status === "Overdue")).toBe(true);
  });

  it("holds an occurrence (Scenario: Hold a ritual)", async () => {
    const { ritualId } = await createRitual(
      {
        actorClerkUserId: "user_ana",
        teamId,
        name: "Demo de viernes",
        cadence: "Weekly",
        startDate: at("2026-07-06T00:00:00Z"),
      },
      db.prisma,
    );
    await generateRitualOccurrences(
      { actorClerkUserId: "user_ana", ritualId, throughDate: at("2026-07-06T00:00:00Z") },
      db.prisma,
    );
    const [occurrence] = await withTenant(
      orgA,
      (tx) => tx.ritualOccurrence.findMany({ where: { ritualId } }),
      db.prisma,
    );

    await markRitualHeld(
      { actorClerkUserId: "user_ana", occurrenceId: occurrence!.id },
      db.prisma,
    );
    const held = await withTenant(
      orgA,
      (tx) => tx.ritualOccurrence.findUniqueOrThrow({ where: { id: occurrence!.id } }),
      db.prisma,
    );
    expect(held.status).toBe("Held");
  });

  it("Colaborador cannot create a ritual", async () => {
    await expect(
      createRitual(
        {
          actorClerkUserId: "user_carla",
          teamId,
          name: "No autorizado",
          cadence: "Weekly",
          startDate: at("2026-07-06T00:00:00Z"),
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "rituals/forbidden" });
  });

  it("rejects a ritual for a team outside the tenant", async () => {
    await expect(
      createRitual(
        {
          actorClerkUserId: "user_ana",
          teamId: teamB,
          name: "Cruzado",
          cadence: "Weekly",
          startDate: at("2026-07-06T00:00:00Z"),
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "teams-staffing/team-not-found" });
  });

  it("rituals data is tenant-isolated 🔒", async () => {
    await createRitual(
      {
        actorClerkUserId: "user_bob",
        teamId: teamB,
        name: "Solo de Org B",
        cadence: "Weekly",
        startDate: at("2026-07-06T00:00:00Z"),
      },
      db.prisma,
    );

    const orgBviews = await listRituals({ actorClerkUserId: "user_bob" }, db.prisma);
    expect(orgBviews).toHaveLength(1);
    expect(orgBviews[0]).toMatchObject({ name: "Solo de Org B" });

    const orgAviews = await listRituals({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(orgAviews).not.toContainEqual(expect.objectContaining({ name: "Solo de Org B" }));
  });
});
