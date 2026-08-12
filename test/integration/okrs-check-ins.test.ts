import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  listAtRiskKeyResults,
  publishObjective,
  recordCheckIn,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("OKR check-ins and confidence risk", () => {
  let db: TestDatabase;
  let organizationId: OrganizationId;
  let memberId: string;
  let objectiveId: string;
  let keyResultId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId } = await createOrganization(
      {
        clerkUserId: "checkin_direction",
        name: "Check-in org",
        creatorEmail: "direction@checkin.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    memberId = (
      await withTenant(organizationId, (tx) => tx.member.findFirstOrThrow(), db.prisma)
    ).id;
    ({ objectiveId } = await createObjective(
      {
        actorClerkUserId: "checkin_direction",
        title: "Mejorar conversión",
        level: "Company",
        ownerMemberId: memberId,
      },
      db.prisma,
    ));
    ({ keyResultId } = await addKeyResult(
      {
        actorClerkUserId: "checkin_direction",
        objectiveId,
        title: "Conversión trial a pago",
        measurementType: "percentage",
        startValue: 10,
        targetValue: 30,
      },
      db.prisma,
    ));
    await publishObjective({ actorClerkUserId: "checkin_direction", objectiveId }, db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  it("rejects a check-in value that mismatches the KeyResult type", async () => {
    await expect(
      recordCheckIn(
        {
          actorClerkUserId: "checkin_direction",
          keyResultId,
          value: true,
          confidence: 8,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/value-type-mismatch" });

    const count = await withTenant(
      organizationId,
      (tx) => tx.checkIn.count({ where: { keyResultId } }),
      db.prisma,
    );
    expect(count).toBe(0);
  });

  it("stores typed value, comment, link and file evidence transactionally", async () => {
    const fileBytes = new TextEncoder().encode("evidencia");
    const { checkInId } = await recordCheckIn(
      {
        actorClerkUserId: "checkin_direction",
        keyResultId,
        value: 18,
        confidence: 4,
        comment: "El experimento mejoró la conversión",
        evidence: [
          { kind: "link", url: "https://example.com/dashboard" },
          {
            kind: "file",
            fileName: "resultado.txt",
            mediaType: "text/plain",
            bytes: fileBytes,
          },
        ],
      },
      db.prisma,
    );

    const stored = await withTenant(
      organizationId,
      (tx) =>
        tx.checkIn.findUniqueOrThrow({
          where: { id: checkInId },
          include: { evidence: { orderBy: { createdAt: "asc" } } },
        }),
      db.prisma,
    );
    expect(stored).toMatchObject({
      confidence: 4,
      comment: "El experimento mejoró la conversión",
    });
    expect(stored.evidence).toHaveLength(2);
    expect(stored.evidence[0]).toMatchObject({
      kind: "Link",
      url: "https://example.com/dashboard",
    });
    expect(stored.evidence[1]).toMatchObject({
      kind: "File",
      fileName: "resultado.txt",
      mediaType: "text/plain",
      sizeBytes: fileBytes.byteLength,
    });
    const keyResult = await withTenant(
      organizationId,
      (tx) => tx.keyResult.findUniqueOrThrow({ where: { id: keyResultId } }),
      db.prisma,
    );
    expect(Number(keyResult.currentValue)).toBe(18);
  });

  it("derives risk from latest confidence and clears it with a healthy check-in", async () => {
    let risks = await listAtRiskKeyResults(
      { actorClerkUserId: "checkin_direction" },
      db.prisma,
    );
    expect(risks.map((risk) => risk.keyResultId)).toContain(keyResultId);

    await recordCheckIn(
      {
        actorClerkUserId: "checkin_direction",
        keyResultId,
        value: 22,
        confidence: 7,
      },
      db.prisma,
    );
    risks = await listAtRiskKeyResults({ actorClerkUserId: "checkin_direction" }, db.prisma);
    expect(risks.map((risk) => risk.keyResultId)).not.toContain(keyResultId);
  });
});
