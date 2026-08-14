import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import type { ProjectStatus } from "../domain/project";
import { findProjectById } from "../infrastructure/project-repo";

export interface GetProjectContextInput {
  actorClerkUserId: string;
  projectId: string;
}

export interface ProjectContextView {
  projectId: string;
  name: string;
  status: ProjectStatus;
}

export async function getProjectContext(
  input: GetProjectContextInput,
  client: PrismaClient = prismaClient(),
): Promise<ProjectContextView> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      const project = await findProjectById(tx, input.projectId);
      if (!project) {
        throw new ApplicationError("teams-staffing/project-not-found", "Project not found");
      }
      return { projectId: project.id, name: project.name, status: project.status };
    },
    client,
  );
}
