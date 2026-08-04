import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

import {
  evaluateLearningRisks,
  recordRetrospective,
} from "../../src/modules/rituals/application";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

/**
 * Retrospectivas (change rituals): registro por Team y riesgo de aprendizaje
 * DERIVADO cuando el Team lleva dos ciclos sin retro. Aislamiento por tenant 🔒.
 */
describe("rituals retrospectives", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
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

    for (const [email, name, role, clerkUserId] of [
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

  it("records a retrospective with the Team and its date (Scenario: Record a retrospective)", async () => {
    const heldAt = daysAgo(3);
    const { retrospectiveId } = await recordRetrospective(
      { actorClerkUserId: "user_ana", teamId, heldAt },
      db.prisma,
    );

    const stored = await withTenant(
      orgA,
      (tx) => tx.retrospective.findUniqueOrThrow({ where: { id: retrospectiveId } }),
      db.prisma,
    );
    expect(stored).toMatchObject({ teamId });
    expect(stored.heldAt.getTime()).toBe(heldAt.getTime());
  });

  it("flags a team two cycles without a retrospective (Scenario: Missing retrospective)", async () => {
    const { teamId: emptyTeam } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Sin retros" },
      db.prisma,
    );
    const { teamId: staleTeam } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Retro vieja" },
      db.prisma,
    );
    await withTenant(
      orgA,
      (tx) =>
        tx.retrospective.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: orgA,
            teamId: staleTeam,
            heldAt: daysAgo(35),
          },
        }),
      db.prisma,
    );

    const risks = await evaluateLearningRisks(
      { actorClerkUserId: "user_ana", teamIds: [emptyTeam, staleTeam] },
      db.prisma,
    );
    expect(risks.find((r) => r.teamId === emptyTeam)?.atRisk).toBe(true);
    expect(risks.find((r) => r.teamId === staleTeam)?.atRisk).toBe(true);
  });

  it("does not flag a team that held a retrospective within the current cycle", async () => {
    const { teamId: freshTeam } = await createTeam(
      { actorClerkUserId: "user_ana", name: "Retro reciente" },
      db.prisma,
    );
    await recordRetrospective(
      { actorClerkUserId: "user_ana", teamId: freshTeam, heldAt: daysAgo(2) },
      db.prisma,
    );

    const risks = await evaluateLearningRisks(
      { actorClerkUserId: "user_ana", teamIds: [freshTeam] },
      db.prisma,
    );
    expect(risks.find((r) => r.teamId === freshTeam)?.atRisk).toBe(false);
  });

  it("Colaborador cannot record a retrospective", async () => {
    await expect(
      recordRetrospective({ actorClerkUserId: "user_carla", teamId }, db.prisma),
    ).rejects.toMatchObject({ code: "rituals/forbidden" });
  });

  it("retrospectives are tenant-isolated 🔒", async () => {
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
    await recordRetrospective(
      { actorClerkUserId: "user_bob", teamId: teamB, heldAt: daysAgo(1) },
      db.prisma,
    );

    expect(await withTenant(orgB, (tx) => tx.retrospective.findMany(), db.prisma)).toHaveLength(
      1,
    );
    const orgARetros = await withTenant(orgA, (tx) => tx.retrospective.findMany(), db.prisma);
    expect(orgARetros.some((r) => r.teamId === teamB)).toBe(false);

    const bobRisks = await evaluateLearningRisks(
      { actorClerkUserId: "user_bob", teamIds: [teamB] },
      db.prisma,
    );
    expect(bobRisks.find((r) => r.teamId === teamB)?.atRisk).toBe(false);
  });
});
