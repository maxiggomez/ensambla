import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { getObjective } from "../../okrs/application";
import { canManageProjects } from "../domain/team-policy";
import { findProjectById, insertProjectObjectives } from "../infrastructure/project-repo";

export interface LinkProjectToObjectivesInput {
  actorClerkUserId: string;
  projectId: string;
  objectiveIds: string[];
}

/**
 * Vincula un Project a uno o más Objectives. Cada Objective se valida vía la
 * interfaz pública de okrs (visibilidad del actor incluida) antes de vincular.
 */
export async function linkProjectToObjectives(
  input: LinkProjectToObjectivesInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  if (input.objectiveIds.length === 0) {
    throw new ApplicationError(
      "teams-staffing/no-objectives",
      "At least one objective is required to link",
    );
  }
  // Validación cross-módulo por la interfaz pública (fuera de la transacción
  // del vínculo; la FK de DB garantiza integridad ante carreras).
  for (const objectiveId of input.objectiveIds) {
    await getObjective({ actorClerkUserId: input.actorClerkUserId, objectiveId }, client);
  }

  await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageProjects(actor.role)) {
        throw new ApplicationError(
          "teams-staffing/forbidden",
          "Role not allowed to manage projects",
        );
      }
      const project = await findProjectById(tx, input.projectId);
      if (!project) {
        throw new ApplicationError("teams-staffing/project-not-found", "Project not found");
      }
      await insertProjectObjectives(
        tx,
        input.objectiveIds.map((objectiveId) => ({
          id: randomUUID(),
          organizationId: actor.organizationId,
          projectId: project.id,
          objectiveId,
        })),
      );
    },
    client,
  );
}
