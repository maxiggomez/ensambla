import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrganization, inviteMember } from "../../src/modules/identity-org/application";
import {
  addKeyResult,
  configureCheckInCadence,
  createObjective,
  listDueCheckInReminders,
  listOkrAudit,
  publishObjective,
} from "../../src/modules/okrs/application";
import { assignTeamMember, createTeam } from "../../src/modules/teams-staffing/application";
import { withTenant } from "../../src/shared/db";
import type { OrganizationId } from "../../src/shared/ids";
import { startMigratedTestDatabase, type TestDatabase } from "../helpers/prisma";

describe("OKR Team scope and cadence", () => {
  let db: TestDatabase;
  let organizationId: OrganizationId;
  let directionMemberId: string;
  let leadMemberId: string;
  let teamId: string;

  beforeAll(async () => {
    db = await startMigratedTestDatabase();
    ({ organizationId } = await createOrganization(
      {
        clerkUserId: "okr_direction",
        name: "OKR cadence org",
        creatorEmail: "direction@okr.test",
        creatorName: "Dirección",
      },
      db.prisma,
    ));
    directionMemberId = (
      await withTenant(organizationId, (tx) => tx.member.findFirstOrThrow(), db.prisma)
    ).id;
    ({ memberId: leadMemberId } = await inviteMember(
      {
        actorClerkUserId: "okr_direction",
        email: "lead@okr.test",
        name: "Lead",
        role: "Lider",
      },
      db.prisma,
    ));
    await withTenant(
      organizationId,
      (tx) =>
        tx.member.update({ where: { id: leadMemberId }, data: { clerkUserId: "okr_lead" } }),
      db.prisma,
    );
    ({ teamId } = await createTeam(
      { actorClerkUserId: "okr_direction", name: "Growth" },
      db.prisma,
    ));
    await assignTeamMember(
      {
        actorClerkUserId: "okr_direction",
        teamId,
        memberId: leadMemberId,
        role: "Lead",
        capacityPercent: 100,
      },
      db.prisma,
    );
  });

  afterAll(async () => {
    await db.stop();
  });

  it("creates a Team objective only with an explicit same-tenant Team", async () => {
    const created = await createObjective(
      {
        actorClerkUserId: "okr_lead",
        title: "Aumentar activación",
        level: "Team",
        ownerMemberId: leadMemberId,
        teamId,
      },
      db.prisma,
    );
    const stored = await withTenant(
      organizationId,
      (tx) => tx.objective.findUniqueOrThrow({ where: { id: created.objectiveId } }),
      db.prisma,
    );
    expect(stored.teamId).toBe(teamId);

    await expect(
      createObjective(
        {
          actorClerkUserId: "okr_lead",
          title: "Sin Team",
          level: "Team",
          ownerMemberId: leadMemberId,
        },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/team-required" });
  });

  it("lets a Team lead configure cadence and Objective cadence overrides Team cadence", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "okr_lead",
        title: "Cadencia efectiva",
        level: "Team",
        ownerMemberId: leadMemberId,
        teamId,
      },
      db.prisma,
    );
    await addKeyResult(
      {
        actorClerkUserId: "okr_lead",
        objectiveId,
        title: "Activaciones",
        measurementType: "integer",
        startValue: 0,
        targetValue: 100,
      },
      db.prisma,
    );
    await publishObjective({ actorClerkUserId: "okr_lead", objectiveId }, db.prisma);

    await configureCheckInCadence(
      { actorClerkUserId: "okr_lead", teamId, cadence: "Weekly" },
      db.prisma,
    );
    await configureCheckInCadence(
      { actorClerkUserId: "okr_lead", objectiveId, cadence: "Monthly" },
      db.prisma,
    );

    const publishedAt = await withTenant(
      organizationId,
      async (tx) =>
        (await tx.objective.findUniqueOrThrow({ where: { id: objectiveId } })).publishedAt!,
      db.prisma,
    );
    const afterEightDays = new Date(publishedAt);
    afterEightDays.setUTCDate(afterEightDays.getUTCDate() + 8);
    const reminders = await listDueCheckInReminders(
      { actorClerkUserId: "okr_lead", now: afterEightDays },
      db.prisma,
    );
    expect(reminders.map((reminder) => reminder.objectiveId)).not.toContain(objectiveId);
    const audit = await listOkrAudit({ actorClerkUserId: "okr_direction" }, db.prisma);
    expect(audit.map((event) => event.action)).toContain("CHECK_IN_CADENCE_CONFIGURED");
  });

  it("rejects a Dirección cadence for a Team from another tenant without auditing it", async () => {
    await createOrganization(
      {
        clerkUserId: "okr_other_direction",
        name: "Other cadence org",
        creatorEmail: "other@okr.test",
        creatorName: "Otra Dirección",
      },
      db.prisma,
    );
    const { teamId: otherTeamId } = await createTeam(
      { actorClerkUserId: "okr_other_direction", name: "Other Team" },
      db.prisma,
    );
    const auditBefore = await listOkrAudit({ actorClerkUserId: "okr_direction" }, db.prisma);

    await expect(
      configureCheckInCadence(
        { actorClerkUserId: "okr_direction", teamId: otherTeamId, cadence: "Weekly" },
        db.prisma,
      ),
    ).rejects.toMatchObject({ code: "okrs/team-not-found" });

    const cadenceCount = await withTenant(
      organizationId,
      (tx) => tx.okrCadenceConfig.count({ where: { teamId: otherTeamId } }),
      db.prisma,
    );
    const auditAfter = await listOkrAudit({ actorClerkUserId: "okr_direction" }, db.prisma);
    expect(cadenceCount).toBe(0);
    expect(auditAfter).toHaveLength(auditBefore.length);
  });

  it("does not produce reminders when no cadence is configured", async () => {
    const { objectiveId } = await createObjective(
      {
        actorClerkUserId: "okr_direction",
        title: "Sin cadencia",
        level: "Company",
        ownerMemberId: directionMemberId,
      },
      db.prisma,
    );
    await addKeyResult(
      {
        actorClerkUserId: "okr_direction",
        objectiveId,
        title: "Resultado",
        measurementType: "check",
      },
      db.prisma,
    );
    await publishObjective({ actorClerkUserId: "okr_direction", objectiveId }, db.prisma);

    const reminders = await listDueCheckInReminders(
      { actorClerkUserId: "okr_direction", now: new Date("2030-01-01T00:00:00.000Z") },
      db.prisma,
    );
    expect(reminders.map((reminder) => reminder.objectiveId)).not.toContain(objectiveId);
  });
});
