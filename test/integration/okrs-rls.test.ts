import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  configureCheckInCadence,
  createObjective,
  createOkrCycle,
  getObjective,
  publishObjective,
  recordCheckIn,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("OKR full-cycle tenant isolation 🔒", () => {
  let db: TestDatabase;
  let orgA: OrganizationId;
  let orgB: OrganizationId;
  let objectiveId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId: orgA } = await createOrganization(
      {
        clerkUserId: "rls_a",
        name: "RLS A",
        creatorEmail: "a@rls.test",
        creatorName: "A",
      },
      db.prisma,
    ));
    ({ organizationId: orgB } = await createOrganization(
      {
        clerkUserId: "rls_b",
        name: "RLS B",
        creatorEmail: "b@rls.test",
        creatorName: "B",
      },
      db.prisma,
    ));
    const memberId = (await withTenant(orgA, (tx) => tx.member.findFirstOrThrow(), db.prisma))
      .id;
    const { cycleId } = await createOkrCycle(
      {
        actorClerkUserId: "rls_a",
        name: "Q1",
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: new Date("2026-03-31T00:00:00.000Z"),
      },
      db.prisma,
    );
    ({ objectiveId } = await createObjective(
      {
        actorClerkUserId: "rls_a",
        title: "Privado de A",
        level: "Company",
        ownerMemberId: memberId,
        cycleId,
      },
      db.prisma,
    ));
    const { keyResultId } = await addKeyResult(
      {
        actorClerkUserId: "rls_a",
        objectiveId,
        title: "KR privado",
        measurementType: "check",
      },
      db.prisma,
    );
    await publishObjective({ actorClerkUserId: "rls_a", objectiveId }, db.prisma);
    await configureCheckInCadence(
      { actorClerkUserId: "rls_a", objectiveId, cadence: "Weekly" },
      db.prisma,
    );
    await recordCheckIn(
      {
        actorClerkUserId: "rls_a",
        keyResultId,
        value: true,
        confidence: 8,
        evidence: [
          {
            kind: "file",
            fileName: "proof.txt",
            mediaType: "text/plain",
            bytes: new TextEncoder().encode("private"),
          },
        ],
      },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("hides cycles, cadence, check-ins, evidence and audit from another Organization", async () => {
    const counts = await withTenant(
      orgB,
      async (tx) => ({
        cycles: await tx.okrCycle.count(),
        cadence: await tx.okrCadenceConfig.count(),
        checkIns: await tx.checkIn.count(),
        evidence: await tx.checkInEvidence.count(),
        audit: await tx.okrAuditEvent.count(),
      }),
      db.prisma,
    );
    expect(counts).toEqual({ cycles: 0, cadence: 0, checkIns: 0, evidence: 0, audit: 0 });
    await expect(
      getObjective({ actorClerkUserId: "rls_b", objectiveId }, db.prisma),
    ).rejects.toMatchObject({ code: "okrs/objective-not-found" });
  });
});
