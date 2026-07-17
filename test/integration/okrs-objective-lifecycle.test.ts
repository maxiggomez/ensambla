import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  publishObjective,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * Ciclo de vida del Objective (change strategy-okrs-core): creación con nivel
 * y owner, policy por rol, y las invariantes de publicación (≥1 KR y todos
 * válidos según su Measurement, ADR-0004).
 */
describe("okrs objective lifecycle", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let anaMemberId: string;
  let carlaMemberId: string;

  async function linkMember(orgId: OrganizationId, email: string, clerkUserId: string) {
    await withTenant(
      orgId,
      (tx) =>
        tx.member.update({
          where: { organizationId_email: { organizationId: orgId, email } },
          data: { clerkUserId },
        }),
      db.prisma,
    );
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
    const anaMembers = await withTenant(orgA, (tx) => tx.member.findMany(), db.prisma);
    anaMemberId = anaMembers[0]!.id;

    ({ memberId: carlaMemberId } = await inviteMember(
      {
        actorClerkUserId: "user_ana",
        email: "carla@org-a.com",
        name: "Carla",
        role: "Colaborador",
      },
      db.prisma,
    ));
    await linkMember(orgA, "carla@org-a.com", "user_carla");
  });

  afterAll(async () => {
    await db.stop();
  });

  it("creates a draft objective with level and owner", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Duplicar ingresos recurrentes",
        level: "Company",
        ownerMemberId: anaMemberId,
      },
      db.prisma,
    );

    const stored = await withTenant(
      orgA,
      (tx) => tx.objective.findUniqueOrThrow({ where: { id: objectiveId } }),
      db.prisma,
    );
    expect(stored).toMatchObject({
      title: "Duplicar ingresos recurrentes",
      level: "Company",
      status: "Draft",
      ownerId: anaMemberId,
    });
  });

  it("rejects creation above the actor's role level", async () => {
    await expect(
      createObjective(
        {
          actorClerkUserId: "user_carla",
          title: "Objetivo de compañía ajeno",
          level: "Company",
          ownerMemberId: carlaMemberId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/forbidden" });
  });

  it("rejects publishing an objective without key results", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Sin key results",
        level: "Company",
        ownerMemberId: anaMemberId,
      },
      db.prisma,
    );

    await expect(
      publishObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma),
    ).rejects.toMatchObject({ code: "okrs/objective-without-key-results" });
  });

  it("rejects publishing while a numeric key result lacks start or target", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "KR numérico incompleto",
        level: "Company",
        ownerMemberId: anaMemberId,
      },
      db.prisma,
    );
    await addKeyResult(
      {
        actorClerkUserId: "user_ana",
        objectiveId,
        title: "Conversión",
        measurementType: "percentage",
        startValue: 2,
        // sin targetValue: inválido para publicar, guardable en draft
      },
      db.prisma,
    );

    await expect(
      publishObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma),
    ).rejects.toMatchObject({ code: "okrs/key-result-invalid" });

    const stored = await withTenant(
      orgA,
      (tx) => tx.objective.findUniqueOrThrow({ where: { id: objectiveId } }),
      db.prisma,
    );
    expect(stored.status).toBe("Draft");
  });

  it("publishes an objective whose key results are all valid", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Publicable",
        level: "Company",
        ownerMemberId: anaMemberId,
      },
      db.prisma,
    );
    await addKeyResult(
      {
        actorClerkUserId: "user_ana",
        objectiveId,
        title: "Ingresos",
        measurementType: "currency",
        startValue: 0,
        targetValue: 100_000,
      },
      db.prisma,
    );
    await addKeyResult(
      {
        actorClerkUserId: "user_ana",
        objectiveId,
        title: "Playbook publicado",
        measurementType: "text",
      },
      db.prisma,
    );

    await publishObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma);

    const stored = await withTenant(
      orgA,
      (tx) => tx.objective.findUniqueOrThrow({ where: { id: objectiveId } }),
      db.prisma,
    );
    expect(stored.status).toBe("Published");
  });
});
