import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  getKeyResultContext,
  listKeyResultContexts,
  publishObjective,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("OKR public KeyResult context", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let visibleKeyResultId: string;
  let draftKeyResultId: string;
  let foreignKeyResultId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "lean_direction",
        name: "Lean Org A",
        creatorEmail: "direction@lean-a.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    const direction = await withTenant(
      orgA,
      (tx) => tx.member.findFirstOrThrow({ where: { clerkUserId: "lean_direction" } }),
      db.prisma,
    );
    await inviteMember(
      {
        actorClerkUserId: "lean_direction",
        email: "member@lean-a.test",
        name: "Member",
        role: "Colaborador",
      },
      db.prisma,
    );
    await withTenant(
      orgA,
      (tx) =>
        tx.member.update({
          where: {
            organizationId_email: { organizationId: orgA, email: "member@lean-a.test" },
          },
          data: { clerkUserId: "lean_member" },
        }),
      db.prisma,
    );

    const published = await createObjective(
      {
        actorClerkUserId: "lean_direction",
        title: "Activación",
        level: "Company",
        ownerMemberId: direction.id,
      },
      db.prisma,
    );
    ({ keyResultId: visibleKeyResultId } = await addKeyResult(
      {
        actorClerkUserId: "lean_direction",
        objectiveId: published.objectiveId,
        title: "Activación semanal",
        measurementType: "percentage",
        startValue: 10,
        targetValue: 40,
      },
      db.prisma,
    ));
    await publishObjective(
      { actorClerkUserId: "lean_direction", objectiveId: published.objectiveId },
      db.prisma,
    );

    const draft = await createObjective(
      {
        actorClerkUserId: "lean_direction",
        title: "Borrador privado",
        level: "Company",
        ownerMemberId: direction.id,
      },
      db.prisma,
    );
    ({ keyResultId: draftKeyResultId } = await addKeyResult(
      {
        actorClerkUserId: "lean_direction",
        objectiveId: draft.objectiveId,
        title: "KR privado",
        measurementType: "check",
      },
      db.prisma,
    ));

    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "lean_foreign",
        name: "Lean Org B",
        creatorEmail: "direction@lean-b.test",
        creatorName: "Foreign",
      },
      db.prisma,
    );
    const foreign = await withTenant(
      orgB,
      (tx) => tx.member.findFirstOrThrow({ where: { clerkUserId: "lean_foreign" } }),
      db.prisma,
    );
    const foreignObjective = await createObjective(
      {
        actorClerkUserId: "lean_foreign",
        title: "Foreign objective",
        level: "Company",
        ownerMemberId: foreign.id,
      },
      db.prisma,
    );
    ({ keyResultId: foreignKeyResultId } = await addKeyResult(
      {
        actorClerkUserId: "lean_foreign",
        objectiveId: foreignObjective.objectiveId,
        title: "Foreign KR",
        measurementType: "check",
      },
      db.prisma,
    ));
  });

  afterAll(async () => db.stop());

  it("resolves a visible KeyResult with its Objective context", async () => {
    await expect(
      getKeyResultContext(
        { actorClerkUserId: "lean_member", keyResultId: visibleKeyResultId },
        db.prisma,
      ),
    ).resolves.toMatchObject({
      keyResultId: visibleKeyResultId,
      keyResultTitle: "Activación semanal",
      objectiveTitle: "Activación",
    });
  });

  it("hides another member's draft and cross-Organization KeyResults", async () => {
    for (const keyResultId of [draftKeyResultId, foreignKeyResultId]) {
      await expect(
        getKeyResultContext({ actorClerkUserId: "lean_member", keyResultId }, db.prisma),
      ).rejects.toMatchObject({ code: "okrs/key-result-not-found" });
    }
  });

  it("resolves a batch with unique visible contexts only", async () => {
    await expect(
      listKeyResultContexts(
        {
          actorClerkUserId: "lean_member",
          keyResultIds: [visibleKeyResultId, visibleKeyResultId, draftKeyResultId],
        },
        db.prisma,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        keyResultId: visibleKeyResultId,
        objectiveTitle: "Activación",
      }),
    ]);
  });
});
