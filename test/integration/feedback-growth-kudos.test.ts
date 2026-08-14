import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { giveKudo, listKudoActivity } from "../../src/modules/feedback-growth/application";
import { inviteMember } from "../../src/modules/identity-org/application";
import { createObjective } from "../../src/modules/okrs/application";
import { defineStrategy } from "../../src/modules/strategy-northstar/application";
import { withTenant } from "../../src/shared/db";
import { createLeanFixture, type LeanFixture } from "../helpers/lean-experiments";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("Kudos and Organization activity", () => {
  let db: TestDatabase;
  let orgA: LeanFixture;
  let orgB: LeanFixture;
  let brunoId: string;
  let carlaId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    orgA = await createLeanFixture(db.prisma, "kudo_a");
    orgB = await createLeanFixture(db.prisma, "kudo_b");
    for (const member of [
      { email: "bruno@kudo-a.test", name: "Bruno", clerkUserId: "kudo_bruno" },
      { email: "carla@kudo-a.test", name: "Carla", clerkUserId: "kudo_carla" },
    ]) {
      const invited = await inviteMember(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          email: member.email,
          name: member.name,
          role: "Colaborador",
        },
        db.prisma,
      );
      if (member.name === "Bruno") brunoId = invited.memberId;
      else carlaId = invited.memberId;
      await withTenant(
        orgA.organizationId,
        (tx) =>
          tx.member.update({
            where: {
              organizationId_email: {
                organizationId: orgA.organizationId,
                email: member.email,
              },
            },
            data: { clerkUserId: member.clerkUserId },
          }),
        db.prisma,
      );
    }
    await defineStrategy(
      { actorClerkUserId: orgA.actorClerkUserId, values: ["Ownership", "Candor"] },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("stores a Kudo with a current Organization Value and Objective context", async () => {
    const { kudoId } = await giveKudo(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        recipientMemberId: brunoId,
        message: "  Gracias por hacerte cargo del resultado.  ",
        value: "Ownership",
        objectiveId: orgA.objectiveId,
      },
      db.prisma,
    );

    const activity = await listKudoActivity({ actorClerkUserId: "kudo_carla" }, db.prisma);
    expect(activity.find((item) => item.kudoId === kudoId)).toMatchObject({
      recipientName: "Bruno",
      message: "Gracias por hacerte cargo del resultado.",
      value: "Ownership",
      context: {
        type: "Objective",
        objectiveId: orgA.objectiveId,
        objectiveTitle: "Objective kudo_a",
      },
    });
  });

  it("shows KeyResult context in Organization activity", async () => {
    const { kudoId } = await giveKudo(
      {
        actorClerkUserId: "kudo_carla",
        recipientMemberId: brunoId,
        message: "Excelente avance del resultado",
        value: "Candor",
        keyResultId: orgA.keyResultId,
      },
      db.prisma,
    );
    expect(
      (await listKudoActivity({ actorClerkUserId: orgA.actorClerkUserId }, db.prisma)).find(
        (item) => item.kudoId === kudoId,
      ),
    ).toMatchObject({
      context: {
        type: "KeyResult",
        keyResultId: orgA.keyResultId,
        keyResultTitle: "KeyResult kudo_a",
        objectiveId: orgA.objectiveId,
      },
    });
  });

  it("retains a Draft Objective context for every Member in public activity", async () => {
    const draft = await createObjective(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        title: "Draft context retained",
        level: "Company",
        ownerMemberId: orgA.memberId,
      },
      db.prisma,
    );
    const { kudoId } = await giveKudo(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        recipientMemberId: brunoId,
        message: "Reconocimiento sobre trabajo todavía en preparación",
        value: "Ownership",
        objectiveId: draft.objectiveId,
      },
      db.prisma,
    );

    expect(
      (await listKudoActivity({ actorClerkUserId: "kudo_carla" }, db.prisma)).find(
        (item) => item.kudoId === kudoId,
      ),
    ).toMatchObject({
      context: {
        type: "Objective",
        objectiveId: draft.objectiveId,
        objectiveTitle: "Draft context retained",
      },
    });
  });

  it("rejects stale Values, ambiguous context and cross-tenant recipients", async () => {
    await expect(
      giveKudo(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          recipientMemberId: brunoId,
          message: "Contexto ambiguo",
          value: "Ownership",
          objectiveId: orgA.objectiveId,
          keyResultId: orgA.keyResultId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/ambiguous-kudo-context" });
    await expect(
      giveKudo(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          recipientMemberId: brunoId,
          message: "Valor viejo",
          value: "Inexistente",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/value-not-found" });
    await expect(
      giveKudo(
        {
          actorClerkUserId: orgA.actorClerkUserId,
          recipientMemberId: orgB.memberId,
          message: "Cross tenant",
          value: "Ownership",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/member-not-found" });
  });

  it("keeps activity tenant isolated", async () => {
    const { kudoId } = await giveKudo(
      {
        actorClerkUserId: orgA.actorClerkUserId,
        recipientMemberId: carlaId,
        message: "Control positivo de aislamiento",
        value: "Candor",
      },
      db.prisma,
    );
    expect(
      (await listKudoActivity({ actorClerkUserId: orgA.actorClerkUserId }, db.prisma)).some(
        (item) => item.kudoId === kudoId,
      ),
    ).toBe(true);
    expect(
      (await listKudoActivity({ actorClerkUserId: orgB.actorClerkUserId }, db.prisma)).some(
        (item) => item.kudoId === kudoId,
      ),
    ).toBe(false);
  });
});
