import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  getObjective,
  listObjectives,
  publishObjective,
  updateKeyResultValue,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

/**
 * 🔒 Roll-up (ADR-0004): el progreso del KR se deriva de su Measurement y el
 * del Objective es el promedio de sus KRs; nunca se edita a mano. Incluye
 * visibilidad de drafts y aislamiento entre tenants (ADR-0003 🔒).
 */
describe("okrs roll-up 🔒", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let anaMemberId: string;

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

    await inviteMember(
      {
        actorClerkUserId: "user_ana",
        email: "carla@org-a.com",
        name: "Carla",
        role: "Colaborador",
      },
      db.prisma,
    );
    await withTenant(
      orgA,
      (tx) =>
        tx.member.update({
          where: { organizationId_email: { organizationId: orgA, email: "carla@org-a.com" } },
          data: { clerkUserId: "user_carla" },
        }),
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  type KeyResultInput = Omit<
    Parameters<typeof addKeyResult>[0],
    "actorClerkUserId" | "objectiveId"
  >;

  async function createPublishedObjective(title: string, krs: KeyResultInput[]) {
    const { objectiveId } = await createObjective(
      { actorClerkUserId: "user_ana", title, level: "Company", ownerMemberId: anaMemberId },
      db.prisma,
    );
    const keyResultIds: string[] = [];
    for (const kr of krs) {
      const { keyResultId } = await addKeyResult(
        { actorClerkUserId: "user_ana", objectiveId, ...kr },
        db.prisma,
      );
      keyResultIds.push(keyResultId);
    }
    await publishObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma);
    return { objectiveId, keyResultIds };
  }

  it("updating a numeric key result recomputes its progress and the objective's", async () => {
    const { objectiveId, keyResultIds } = await createPublishedObjective("Numérico + check", [
      { title: "Clientes nuevos", measurementType: "integer", startValue: 0, targetValue: 10 },
      { title: "Firmar alianza", measurementType: "check" },
    ]);
    const [integerKrId, checkKrId] = keyResultIds as [string, string];

    await updateKeyResultValue(
      { actorClerkUserId: "user_ana", keyResultId: integerKrId, value: 5 },
      db.prisma,
    );

    let objective = await getObjective(
      { actorClerkUserId: "user_ana", objectiveId },
      db.prisma,
    );
    expect(objective.keyResults.find((kr) => kr.id === integerKrId)?.progress).toBe(50);
    expect(objective.progress).toBe(25); // (50 + 0) / 2

    // Check hecho → 100 y recompute del Objective.
    await updateKeyResultValue(
      { actorClerkUserId: "user_ana", keyResultId: checkKrId, value: true },
      db.prisma,
    );
    objective = await getObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma);
    expect(objective.keyResults.find((kr) => kr.id === checkKrId)?.progress).toBe(100);
    expect(objective.progress).toBe(75); // (50 + 100) / 2
  });

  it("a text key result contributes 0 or 100 according to its state", async () => {
    const { objectiveId, keyResultIds } = await createPublishedObjective("Texto + check", [
      { title: "Playbook comercial", measurementType: "text" },
      { title: "Contratar SDR", measurementType: "check", checkDone: true },
    ]);
    const [textKrId] = keyResultIds as [string, string];

    let objective = await getObjective(
      { actorClerkUserId: "user_ana", objectiveId },
      db.prisma,
    );
    expect(objective.progress).toBe(50); // (0 + 100) / 2

    await updateKeyResultValue(
      { actorClerkUserId: "user_ana", keyResultId: textKrId, value: "done" },
      db.prisma,
    );
    objective = await getObjective({ actorClerkUserId: "user_ana", objectiveId }, db.prisma);
    expect(objective.progress).toBe(100);
  });

  it("a Colaborador sees published objectives but not someone else's drafts", async () => {
    const { objectiveId: publishedId } = await createPublishedObjective("Visible publicado", [
      { title: "Check", measurementType: "check" },
    ]);
    const { objectiveId: draftId } = await createObjective(
      {
        actorClerkUserId: "user_ana",
        title: "Draft privado de Ana",
        level: "Company",
        ownerMemberId: anaMemberId,
      },
      db.prisma,
    );

    const seenByCarla = await listObjectives({ actorClerkUserId: "user_carla" }, db.prisma);
    const idsSeenByCarla = seenByCarla.map((o) => o.id);
    expect(idsSeenByCarla).toContain(publishedId);
    expect(idsSeenByCarla).not.toContain(draftId);

    const seenByAna = await listObjectives({ actorClerkUserId: "user_ana" }, db.prisma);
    expect(seenByAna.map((o) => o.id)).toContain(draftId);
  });

  it("objectives and key results are tenant-isolated 🔒", async () => {
    const { objectiveId } = await createPublishedObjective("Solo de Org A", [
      { title: "Check", measurementType: "check" },
    ]);

    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "user_bob",
        name: "Org B",
        creatorEmail: "bob@org-b.com",
        creatorName: "Bob",
      },
      db.prisma,
    );

    const objectivesSeenByB = await withTenant(
      orgB,
      (tx) => tx.objective.findMany(),
      db.prisma,
    );
    expect(objectivesSeenByB).toEqual([]);
    const keyResultsSeenByB = await withTenant(
      orgB,
      (tx) => tx.keyResult.findMany(),
      db.prisma,
    );
    expect(keyResultsSeenByB).toEqual([]);

    await expect(
      getObjective({ actorClerkUserId: "user_bob", objectiveId }, db.prisma),
    ).rejects.toMatchObject({ code: "okrs/objective-not-found" });
  });
});
