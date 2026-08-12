import { prismaClient, type CheckInCadence, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import { assertMutableObjective } from "../domain/cycle-close";
import {
  findCadenceObjective,
  type CadenceTarget,
  upsertCadence,
} from "../infrastructure/cadence-repo";
import { insertAuditEvent } from "../infrastructure/audit-repo";

export type ConfigureCheckInCadenceInput = {
  actorClerkUserId: string;
  cadence: CheckInCadence;
} & CadenceTarget;

export async function configureCheckInCadence(
  input: ConfigureCheckInCadenceInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  const context = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (input.objectiveId) {
        const objective = await findCadenceObjective(tx, input.objectiveId);
        if (!objective) {
          throw new ApplicationError("okrs/objective-not-found", "Objective not found");
        }
        assertMutableObjective(objective.status);
        return { actor, teamId: objective.teamId };
      }
      return { actor, teamId: input.teamId };
    },
    client,
  );

  let teamAssignments: Awaited<ReturnType<typeof listTeamAssignments>> = [];
  if (context.teamId) {
    try {
      teamAssignments = await listTeamAssignments(
        { actorClerkUserId: input.actorClerkUserId, teamId: context.teamId },
        client,
      );
    } catch (error) {
      if (error instanceof ApplicationError && error.code === "teams-staffing/team-not-found") {
        throw new ApplicationError("okrs/team-not-found", "Team not found");
      }
      throw error;
    }
  }

  if (context.actor.role !== "Direccion") {
    if (!context.teamId) {
      throw new ApplicationError(
        "okrs/forbidden",
        "Only Dirección can configure cadence outside a Team",
      );
    }
    if (
      !teamAssignments.some(
        (item) => item.memberId === context.actor.id && item.role === "Lead",
      )
    ) {
      throw new ApplicationError(
        "okrs/forbidden",
        "Only Dirección or the Team lead can configure cadence",
      );
    }
  }

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      await upsertCadence(tx, actor.organizationId, input, input.cadence);
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "CHECK_IN_CADENCE_CONFIGURED",
        entityType: input.objectiveId ? "Objective" : "Team",
        entityId: input.objectiveId ?? input.teamId,
        metadata: { cadence: input.cadence },
      });
    },
    client,
  );
}
