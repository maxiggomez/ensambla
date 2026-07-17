import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  publishObjective,
} from "../../src/modules/okrs/application";
import {
  createProject,
  evaluateAlignment,
  linkProjectToObjectives,
} from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Projects ↔ Objectives (change teams-staffing-core): links, alerta de
 * project sin OKR y riesgo de KR sin Project. Los Objectives se leen vía la
 * interfaz pública de okrs. Tablas nuevas aisladas por tenant (🔒).
 */
describe("teams-staffing projects & alignment", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let anaMemberId: string;

  async function publishedObjective(
    title: string,
  ): Promise<{ objectiveId: string; krId: string }> {
    const { objectiveId } = await createObjective(
      { actorClerkUserId: "user_ana", title, level: "Company", ownerMemberId: anaMemberId },
      db.prisma,
    );
    const { keyResultId } = await addKeyResult(
      {
        actorClerkUserId: "user_ana",
        objectiveId,
        title: `KR de ${title}`,
        measurementType: "check",
      },
      db.prisma,
    );
    await publishObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma);
    return { objectiveId, krId: keyResultId };
  }

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
    const members = await withTenant(orgA, (tx) => tx.member.findMany(), db.prisma);
    anaMemberId = members[0]!.id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("links a project to one or more objectives", async () => {
    const { objectiveId } = await publishedObjective("Objetivo enlazado");
    const { projectId } = await createProject(
      { actorClerkUserId: "user_ana", name: "Proyecto Alfa" },
      db.prisma,
    );

    await linkProjectToObjectives(
      { actorClerkUserId: "user_ana", projectId, objectiveIds: [objectiveId] },
      db.prisma,
    );

    const links = await withTenant(
      orgA,
      (tx) => tx.projectObjective.findMany({ where: { projectId } }),
      db.prisma,
    );
    expect(links.map((l) => l.objectiveId)).toEqual([objectiveId]);
  });

  it("raises 'project without OKR' and flags KRs of published objectives with no project", async () => {
    const { objectiveId, krId } = await publishedObjective("Objetivo descubierto");
    const { projectId: orphanProjectId } = await createProject(
      { actorClerkUserId: "user_ana", name: "Proyecto sin OKR" },
      db.prisma,
    );

    let alerts = await evaluateAlignment({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(alerts.projectsWithoutOkr).toContain(orphanProjectId);
    expect(alerts.keyResultsWithoutProject).toContain(krId);

    // Vincular el project al objective resuelve ambos lados.
    await linkProjectToObjectives(
      { actorClerkUserId: "user_ana", projectId: orphanProjectId, objectiveIds: [objectiveId] },
      db.prisma,
    );
    alerts = await evaluateAlignment({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(alerts.projectsWithoutOkr).not.toContain(orphanProjectId);
    expect(alerts.keyResultsWithoutProject).not.toContain(krId);
  });

  it("projects and links are tenant-isolated 🔒", async () => {
    await createProject({ actorClerkUserId: "user_ana", name: "Solo de Org A" }, db.prisma);
    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );

    expect(await withTenant(orgB, (tx) => tx.project.findMany(), db.prisma)).toEqual([]);
    expect(await withTenant(orgB, (tx) => tx.projectObjective.findMany(), db.prisma)).toEqual(
      [],
    );
    const alerts = await evaluateAlignment({ actorClerkUserId: "user_bob" }, db.prisma);
    expect(alerts.projectsWithoutOkr).toEqual([]);
    expect(alerts.keyResultsWithoutProject).toEqual([]);
  });
});
