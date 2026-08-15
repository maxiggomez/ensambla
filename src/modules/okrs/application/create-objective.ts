import { randomUUID } from "node:crypto";

import {
  prismaClient,
  tryAcquireOrganizationStructureLock,
  type PrismaClient,
} from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { organizationId } from "../../../shared/ids";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listTeamAssignments } from "../../teams-staffing/application";
import { validateObjectiveScope } from "../domain/alignment";
import { insertAuditEvent } from "../infrastructure/audit-repo";
import { objectiveTitle, type ObjectiveLevel } from "../domain/objective";
import { canCreateObjective } from "../domain/objective-policy";
import {
  findCycle,
  findObjectiveWithKeyResults,
  findOwnerMember,
  insertObjective,
} from "../infrastructure/objective-repo";

export interface CreateObjectiveInput {
  actorClerkUserId: string;
  title: string;
  level: ObjectiveLevel;
  ownerMemberId: string;
  teamId?: string | null;
  parentObjectiveId?: string | null;
  cycleId?: string | null;
}

/** Crea un Objective en draft con nivel y owner, según la policy por rol. */
export async function createObjective(
  input: CreateObjectiveInput,
  client: PrismaClient = prismaClient(),
): Promise<{ objectiveId: string }> {
  const title = objectiveTitle(input.title);
  const { teamId } = validateObjectiveScope(input.level, input.teamId ?? null);
  if (teamId !== null) {
    await listTeamAssignments({ actorClerkUserId: input.actorClerkUserId, teamId }, client);
  }

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canCreateObjective(actor.role, input.level)) {
        throw new ApplicationError(
          "okrs/forbidden",
          `Role not allowed to create a ${input.level}-level objective`,
        );
      }
      if (
        !(await tryAcquireOrganizationStructureLock(tx, organizationId(actor.organizationId)))
      ) {
        throw new ApplicationError(
          "okrs/structure-busy",
          "Organization structure is being changed concurrently",
        );
      }
      // Lookup RLS-scoped: un ownerMemberId de otro tenant no existe acá.
      const owner = await findOwnerMember(tx, input.ownerMemberId);
      if (!owner) {
        throw new ApplicationError("okrs/owner-not-found", "Owner member not found");
      }
      if (input.parentObjectiveId) {
        const parent = await findObjectiveWithKeyResults(tx, input.parentObjectiveId);
        if (!parent) {
          throw new ApplicationError("okrs/parent-not-found", "Parent objective not found");
        }
      }
      if (input.cycleId && !(await findCycle(tx, input.cycleId))) {
        throw new ApplicationError("okrs/cycle-not-found", "OKR cycle not found");
      }

      const objectiveId = randomUUID();
      await insertObjective(tx, {
        id: objectiveId,
        organizationId: actor.organizationId,
        title,
        level: input.level,
        ownerId: owner.id,
        teamId,
        parentObjectiveId: input.parentObjectiveId ?? null,
        cycleId: input.cycleId ?? null,
      });
      await insertAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorMemberId: actor.id,
        action: "OBJECTIVE_CREATED",
        entityType: "Objective",
        entityId: objectiveId,
        metadata: { level: input.level },
      });
      return { objectiveId };
    },
    client,
  );
}
