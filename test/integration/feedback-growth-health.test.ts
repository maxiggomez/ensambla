import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getFeedbackHealth, giveFeedback } from "../../src/modules/feedback-growth/application";
import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("privacy-safe Feedback health", () => {
  let db: TestDatabase;
  let organizationId: OrganizationId;
  let anaId: string;
  let brunoId: string;
  let foreignMemberId: string;
  let recentFeedbackId: string;

  const since = new Date("2026-07-15T00:00:00.000Z");

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId } = await createOrganization(
      {
        clerkUserId: "feedback_health_ana",
        name: "Feedback Health A",
        creatorEmail: "ana@feedback-health.test",
        creatorName: "Ana",
      },
      db.prisma,
    ));
    anaId = await withTenant(
      organizationId,
      async (tx) =>
        (await tx.member.findFirstOrThrow({ where: { clerkUserId: "feedback_health_ana" } }))
          .id,
      db.prisma,
    );

    const bruno = await inviteMember(
      {
        actorClerkUserId: "feedback_health_ana",
        email: "bruno@feedback-health.test",
        name: "Bruno",
        role: "Colaborador",
      },
      db.prisma,
    );
    brunoId = bruno.memberId;

    ({ feedbackId: recentFeedbackId } = await giveFeedback(
      {
        actorClerkUserId: "feedback_health_ana",
        recipientMemberId: brunoId,
        body: "Contenido que nunca debe cruzar el contrato agregado",
        classification: "strength",
      },
      db.prisma,
    ));
    const { feedbackId: oldFeedbackId } = await giveFeedback(
      {
        actorClerkUserId: "feedback_health_ana",
        recipientMemberId: brunoId,
        body: "Feedback fuera de ventana",
        classification: "improvement",
      },
      db.prisma,
    );
    await withTenant(
      organizationId,
      (tx) =>
        tx.feedback.update({
          where: { id: oldFeedbackId },
          data: { createdAt: new Date("2026-07-01T00:00:00.000Z") },
        }),
      db.prisma,
    );

    const { organizationId: foreignOrganizationId } = await createOrganization(
      {
        clerkUserId: "feedback_health_foreign",
        name: "Feedback Health B",
        creatorEmail: "foreign@feedback-health.test",
        creatorName: "Foreign",
      },
      db.prisma,
    );
    foreignMemberId = await withTenant(
      foreignOrganizationId,
      async (tx) =>
        (
          await tx.member.findFirstOrThrow({
            where: { clerkUserId: "feedback_health_foreign" },
          })
        ).id,
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("returns only aggregate counts for unique tenant-valid group members", async () => {
    const [health] = await getFeedbackHealth(
      {
        actorClerkUserId: "feedback_health_ana",
        groups: [{ groupId: "team-a", memberIds: [anaId, brunoId, brunoId] }],
        since,
      },
      db.prisma,
    );

    expect(health).toEqual({
      groupId: "team-a",
      memberCount: 2,
      completedFeedbackCount: 1,
    });
    expect(Object.keys(health ?? {}).sort()).toEqual([
      "completedFeedbackCount",
      "groupId",
      "memberCount",
    ]);
    expect(JSON.stringify(health)).not.toContain(recentFeedbackId);
    expect(JSON.stringify(health)).not.toContain("Contenido que nunca");
  });

  it("excludes Feedback before the requested boundary and handles an empty group", async () => {
    await expect(
      getFeedbackHealth(
        {
          actorClerkUserId: "feedback_health_ana",
          groups: [
            { groupId: "ana-only", memberIds: [anaId] },
            { groupId: "empty", memberIds: [] },
          ],
          since,
        },
        db.prisma,
      ),
    ).resolves.toEqual([
      { groupId: "ana-only", memberCount: 1, completedFeedbackCount: 0 },
      { groupId: "empty", memberCount: 0, completedFeedbackCount: 0 },
    ]);
  });

  it("rejects a foreign Organization member before aggregating", async () => {
    await expect(
      getFeedbackHealth(
        {
          actorClerkUserId: "feedback_health_ana",
          groups: [{ groupId: "mixed", memberIds: [anaId, foreignMemberId] }],
          since,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "feedback-growth/member-not-found" });
  });
});
