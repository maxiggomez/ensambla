import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  giveFeedback,
  listFeedbackRequests,
  listPrivateFeedback,
  requestFeedback,
} from "../../src/modules/feedback-growth/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { defineStrategy } from "../../src/modules/strategy-northstar/application";
import { createProject } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("private Feedback and requests", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let brunoId: string;
  let carlaId: string;
  let bobId: string;
  let projectId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "feedback_ana",
        name: "Feedback Org A",
        creatorEmail: "ana@feedback-a.test",
        creatorName: "Ana",
      },
      db.prisma,
    ));

    for (const member of [
      { email: "bruno@feedback-a.test", name: "Bruno", clerkUserId: "feedback_bruno" },
      { email: "carla@feedback-a.test", name: "Carla", clerkUserId: "feedback_carla" },
    ]) {
      const invited = await inviteMember(
        {
          actorClerkUserId: "feedback_ana",
          email: member.email,
          name: member.name,
          role: "Colaborador",
        },
        db.prisma,
      );
      if (member.name === "Bruno") brunoId = invited.memberId;
      else carlaId = invited.memberId;
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

    await defineStrategy(
      { actorClerkUserId: "feedback_ana", values: ["Ownership", "Candor"] },
      db.prisma,
    );
    ({ projectId } = await createProject(
      { actorClerkUserId: "feedback_ana", name: "Expansión regional" },
      db.prisma,
    ));

    const { organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "feedback_bob",
        name: "Feedback Org B",
        creatorEmail: "bob@feedback-b.test",
        creatorName: "Bob",
      },
      db.prisma,
    );
    const bob = await withTenant(
      orgB,
      (tx) => tx.member.findFirstOrThrow({ where: { clerkUserId: "feedback_bob" } }),
      db.prisma,
    );
    bobId = bob.id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("stores classified Feedback with Project and current Value links", async () => {
    const { feedbackId } = await giveFeedback(
      {
        actorClerkUserId: "feedback_ana",
        recipientMemberId: brunoId,
        body: "  Lideraste muy bien la coordinación.  ",
        classification: "strength",
        projectId,
        value: "Ownership",
      },
      db.prisma,
    );

    const authored = await listPrivateFeedback({ actorClerkUserId: "feedback_ana" }, db.prisma);
    const received = await listPrivateFeedback(
      { actorClerkUserId: "feedback_bruno" },
      db.prisma,
    );
    expect(authored.find((item) => item.feedbackId === feedbackId)).toMatchObject({
      body: "Lideraste muy bien la coordinación.",
      classification: "strength",
      recipientName: "Bruno",
      project: { projectId, name: "Expansión regional", status: "Active" },
      value: "Ownership",
    });
    expect(received.some((item) => item.feedbackId === feedbackId)).toBe(true);
  });

  it("delivers a request and fulfills it atomically through Feedback", async () => {
    const { requestId } = await requestFeedback(
      {
        actorClerkUserId: "feedback_bruno",
        requestedFromMemberId: carlaId,
        prompt: "¿Qué puedo mejorar al priorizar?",
      },
      db.prisma,
    );
    expect(
      (await listFeedbackRequests({ actorClerkUserId: "feedback_carla" }, db.prisma)).inbox,
    ).toContainEqual(
      expect.objectContaining({ requestId, pending: true, requesterName: "Bruno" }),
    );
    expect(
      (await listFeedbackRequests({ actorClerkUserId: "feedback_bruno" }, db.prisma)).outbox,
    ).toContainEqual(expect.objectContaining({ requestId, pending: true }));

    const { feedbackId } = await giveFeedback(
      {
        actorClerkUserId: "feedback_carla",
        recipientMemberId: brunoId,
        body: "Podés hacer explícitos los trade-offs.",
        classification: "improvement",
        requestId,
      },
      db.prisma,
    );
    expect(
      (await listFeedbackRequests({ actorClerkUserId: "feedback_carla" }, db.prisma)).inbox,
    ).toContainEqual(expect.objectContaining({ requestId, pending: false, feedbackId }));
  });

  it("keeps Feedback private from a third same-tenant Member and another Organization", async () => {
    const { feedbackId } = await giveFeedback(
      {
        actorClerkUserId: "feedback_ana",
        recipientMemberId: brunoId,
        body: "Feedback privado",
        classification: "improvement",
      },
      db.prisma,
    );
    expect(
      (await listPrivateFeedback({ actorClerkUserId: "feedback_carla" }, db.prisma)).some(
        (item) => item.feedbackId === feedbackId,
      ),
    ).toBe(false);
    expect(await listPrivateFeedback({ actorClerkUserId: "feedback_bob" }, db.prisma)).toEqual(
      [],
    );
  });

  it("rejects cross-tenant Members, Projects and stale Values", async () => {
    await expect(
      giveFeedback(
        {
          actorClerkUserId: "feedback_ana",
          recipientMemberId: bobId,
          body: "No debe cruzar tenant",
          classification: "strength",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/member-not-found" });

    await expect(
      giveFeedback(
        {
          actorClerkUserId: "feedback_ana",
          recipientMemberId: brunoId,
          body: "Valor viejo",
          classification: "strength",
          value: "Valor inexistente",
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/value-not-found" });
  });
});
