import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { closeProjectStatus } from "../domain/project";
import { canManageProjects } from "../domain/team-policy";
import { closeProjectIfActive, findProjectById } from "../infrastructure/project-repo";

export interface CloseProjectInput {
  actorClerkUserId: string;
  projectId: string;
}

export async function closeProject(
  input: CloseProjectInput,
  client: PrismaClient = prismaClient(),
): Promise<void> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageProjects(actor.role)) {
        throw new ApplicationError(
          "teams-staffing/forbidden",
          "Role not allowed to manage Projects",
        );
      }
      const project = await findProjectById(tx, input.projectId);
      if (!project) {
        throw new ApplicationError("teams-staffing/project-not-found", "Project not found");
      }
      closeProjectStatus(project.status);
      const closed = await closeProjectIfActive(tx, {
        organizationId: actor.organizationId,
        projectId: project.id,
      });
      if (!closed) {
        throw new ApplicationError(
          "teams-staffing/invalid-project-transition",
          "Project changed before it could be closed",
        );
      }
    },
    client,
  );
}
