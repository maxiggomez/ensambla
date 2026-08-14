import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  closeProject,
  createProject,
  getProjectContext,
} from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("teams-staffing Project lifecycle", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "project_dir_a",
        name: "Project Org A",
        creatorEmail: "dir@project-a.test",
        creatorName: "Dirección A",
      },
      db.prisma,
    ));

    for (const member of [
      {
        email: "leader@project-a.test",
        name: "Líder A",
        role: "Lider" as const,
        clerkUserId: "project_leader_a",
      },
      {
        email: "collab@project-a.test",
        name: "Colaborador A",
        role: "Colaborador" as const,
        clerkUserId: "project_collab_a",
      },
    ]) {
      await inviteMember(
        {
          actorClerkUserId: "project_dir_a",
          email: member.email,
          name: member.name,
          role: member.role,
        },
        db.prisma,
      );
      await withTenant(
        orgA,
        (tx) =>
          tx.member.update({
            where: { organizationId_email: { organizationId: orgA, email: member.email } },
            data: { clerkUserId: member.clerkUserId },
          }),
        db.prisma,
      );
    }
  });

  afterAll(async () => {
    await db.stop();
  });

  it("creates Active and lets Dirección close with compare-and-set", async () => {
    const { projectId } = await createProject(
      { actorClerkUserId: "project_dir_a", name: "Proyecto a cerrar" },
      db.prisma,
    );
    await expect(
      getProjectContext({ actorClerkUserId: "project_collab_a", projectId }, db.prisma),
    ).resolves.toMatchObject({ projectId, name: "Proyecto a cerrar", status: "Active" });

    const attempts = await Promise.allSettled([
      closeProject({ actorClerkUserId: "project_dir_a", projectId }, db.prisma),
      closeProject({ actorClerkUserId: "project_dir_a", projectId }, db.prisma),
    ]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    expect(
      await getProjectContext({ actorClerkUserId: "project_collab_a", projectId }, db.prisma),
    ).toMatchObject({ status: "Closed" });
  });

  it("lets Líder close and rejects Colaborador plus repeated closure", async () => {
    const { projectId: leaderProject } = await createProject(
      { actorClerkUserId: "project_leader_a", name: "Proyecto del líder" },
      db.prisma,
    );
    await expect(
      closeProject(
        { actorClerkUserId: "project_collab_a", projectId: leaderProject },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "teams-staffing/forbidden" });
    await closeProject(
      { actorClerkUserId: "project_leader_a", projectId: leaderProject },
      db.prisma,
    );
    await expect(
      closeProject(
        { actorClerkUserId: "project_leader_a", projectId: leaderProject },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "teams-staffing/invalid-project-transition" });
  });

  it("keeps Project context tenant scoped", async () => {
    const { projectId } = await createProject(
      { actorClerkUserId: "project_dir_a", name: "Sólo Org A" },
      db.prisma,
    );
    await createOrganization(
      {
        clerkUserId: "project_dir_b",
        name: "Project Org B",
        creatorEmail: "dir@project-b.test",
        creatorName: "Dirección B",
      },
      db.prisma,
    );

    await expect(
      getProjectContext({ actorClerkUserId: "project_dir_b", projectId }, db.prisma),
    ).rejects.toMatchObject({ code: "teams-staffing/project-not-found" });
  });
});
