import { prismaClient, type PrismaClient } from "../../../shared/db";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { listProjects } from "../infrastructure/project-repo";

import type { ProjectContextView } from "./get-project-context";

export async function listProjectContexts(
  input: { actorClerkUserId: string },
  client: PrismaClient = prismaClient(),
): Promise<ProjectContextView[]> {
  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      await requireActor(tx, input.actorClerkUserId);
      return (await listProjects(tx)).map((project) => ({
        projectId: project.id,
        name: project.name,
        status: project.status,
      }));
    },
    client,
  );
}
