import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  createObjective,
  listOkrAudit,
  publishObjective,
  recordCheckIn,
  updateKeyResultValue,
} from "../../src/modules/okrs/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("immutable OKR audit trail 🔒", () => {
  let db: TestDatabase;
  let organizationId: OrganizationId;
  let memberId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId } = await createOrganization(
      {
        clerkUserId: "audit_direction",
        name: "Audit org",
        creatorEmail: "direction@audit.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    memberId = (
      await withTenant(organizationId, (tx) => tx.member.findFirstOrThrow(), db.prisma)
    ).id;
  });

  afterAll(async () => {
    await db.stop();
  });

  it("records successful legacy and new mutations", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "audit_direction",
        title: "Objetivo auditado",
        level: "Company",
        ownerMemberId: memberId,
      },
      db.prisma,
    );
    const { keyResultId } = await addKeyResult(
      {
        actorClerkUserId: "audit_direction",
        objectiveId,
        title: "KR auditado",
        measurementType: "check",
      },
      db.prisma,
    );
    await publishObjective({ actorClerkUserId: "audit_direction", objectiveId }, db.prisma);
    await updateKeyResultValue(
      { actorClerkUserId: "audit_direction", keyResultId, value: true },
      db.prisma,
    );
    await recordCheckIn(
      {
        actorClerkUserId: "audit_direction",
        keyResultId,
        value: true,
        confidence: 8,
      },
      db.prisma,
    );

    const audit = await listOkrAudit({ actorClerkUserId: "audit_direction" }, db.prisma);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "OBJECTIVE_CREATED",
        "KEY_RESULT_ADDED",
        "OBJECTIVE_PUBLISHED",
        "KEY_RESULT_VALUE_UPDATED",
        "CHECK_IN_RECORDED",
      ]),
    );
    expect(audit.every((event) => event.actorMemberId === memberId)).toBe(true);
  });

  it("does not record a failed mutation", async () => {
    const before = await listOkrAudit({ actorClerkUserId: "audit_direction" }, db.prisma);
    await expect(
      createObjective(
        {
          actorClerkUserId: "audit_direction",
          title: "Team inválido",
          level: "Team",
          ownerMemberId: memberId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/team-required" });
    const after = await listOkrAudit({ actorClerkUserId: "audit_direction" }, db.prisma);
    expect(after).toHaveLength(before.length);
  });

  it("isolates audit history and prevents update or delete at database level", async () => {
    const audit = await listOkrAudit({ actorClerkUserId: "audit_direction" }, db.prisma);
    const event = audit[0]!;

    const updated = await withTenant(
      organizationId,
      (tx) =>
        tx.$executeRaw`UPDATE okr_audit_event SET action = 'MUTATED' WHERE id = ${event.id}::uuid`,
      db.prisma,
    );
    const deleted = await withTenant(
      organizationId,
      (tx) => tx.$executeRaw`DELETE FROM okr_audit_event WHERE id = ${event.id}::uuid`,
      db.prisma,
    );
    expect(updated).toBe(0);
    expect(deleted).toBe(0);

    await createOrganization(
      {
        clerkUserId: "audit_other_direction",
        name: "Other audit org",
        creatorEmail: "other@audit.test",
        creatorName: "Otra Dirección",
      },
      db.prisma,
    );
    const otherAudit = await listOkrAudit(
      { actorClerkUserId: "audit_other_direction" },
      db.prisma,
    );
    expect(otherAudit).toEqual([]);
    const stillStored = await listOkrAudit({ actorClerkUserId: "audit_direction" }, db.prisma);
    expect(stillStored.find((item) => item.id === event.id)?.action).toBe(event.action);
  });
});
