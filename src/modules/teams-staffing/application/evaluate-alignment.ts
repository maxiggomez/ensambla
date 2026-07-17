import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listObjectives } from "../../okrs/application";
import {
  evaluateAlignment as alignmentAlerts,
  type AlignmentAlerts,
} from "../domain/alignment";
import { listProjectsWithLinks } from "../infrastructure/project-repo";

export interface EvaluateAlignmentInput {
  actorClerkUserId: string;
}

/**
 * Alertas de alineamiento: projects sin OKR y KeyResults de Objectives
 * publicados sin Project que los mueva. Los Objectives se leen vía la interfaz
 * pública de okrs (hereda la visibilidad del actor; los publicados los ven
 * todos los roles).
 */
export async function evaluateAlignment(
  input: EvaluateAlignmentInput,
  client: PrismaClient = prismaClient(),
): Promise<AlignmentAlerts> {
  const objectives = await listObjectives({ actorClerkUserId: input.actorClerkUserId }, client);

  const projects = await withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return listProjectsWithLinks(tx);
    },
    client,
  );

  return alignmentAlerts(
    projects.map((project) => ({
      projectId: project.id,
      objectiveIds: project.objectiveLinks.map((link) => link.objectiveId),
    })),
    objectives.map((objective) => ({
      objectiveId: objective.id,
      status: objective.status,
      keyResultIds: objective.keyResults.map((keyResult) => keyResult.id),
    })),
  );
}
