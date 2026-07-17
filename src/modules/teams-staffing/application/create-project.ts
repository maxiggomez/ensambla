import { randomUUID } from "node:crypto";

import { prismaClient, type PrismaClient } from "../../../shared/db";
import { ApplicationError } from "../../../shared/errors";
import { withTenantForUser } from "../../../shared/tenancy";
import { requireActor } from "../../identity-org/application";
import { projectName } from "../domain/project";
import { canManageProjects } from "../domain/team-policy";
import { insertProject } from "../infrastructure/project-repo";

export interface CreateProjectInput {
  actorClerkUserId: string;
  name: string;
}

export async function createProject(
  input: CreateProjectInput,
  client: PrismaClient = prismaClient(),
): Promise<{ projectId: string }> {
  const name = projectName(input.name);

  return withTenantForUser(
    input.actorClerkUserId,
    async (tx) => {
      const actor = await requireActor(tx, input.actorClerkUserId);
      if (!canManageProjects(actor.role)) {
        throw new ApplicationError(
          "teams-staffing/forbidden",
          "Role not allowed to manage projects",
        );
      }
      const projectId = randomUUID();
      await insertProject(tx, { id: projectId, organizationId: actor.organizationId, name });
      return { projectId };
    },
    client,
  );
}
