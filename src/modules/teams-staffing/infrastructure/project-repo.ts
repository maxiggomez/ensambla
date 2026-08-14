import type { Project, ProjectObjective, TenantClient } from "../../../shared/db";

export type ProjectWithLinks = Project & { objectiveLinks: ProjectObjective[] };

export interface InsertProjectInput {
  id: string;
  organizationId: string;
  name: string;
}

export async function insertProject(
  tx: TenantClient,
  input: InsertProjectInput,
): Promise<void> {
  await tx.project.create({ data: input });
}

export function findProjectById(tx: TenantClient, id: string): Promise<Project | null> {
  return tx.project.findUnique({ where: { id } });
}

export function listProjects(tx: TenantClient): Promise<Project[]> {
  return tx.project.findMany({ orderBy: { createdAt: "asc" } });
}

export async function closeProjectIfActive(
  tx: TenantClient,
  input: { organizationId: string; projectId: string },
): Promise<boolean> {
  const result = await tx.project.updateMany({
    where: {
      id: input.projectId,
      organizationId: input.organizationId,
      status: "Active",
    },
    data: { status: "Closed" },
  });
  return result.count === 1;
}

export function listProjectsWithLinks(tx: TenantClient): Promise<ProjectWithLinks[]> {
  return tx.project.findMany({
    include: { objectiveLinks: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function insertProjectObjectives(
  tx: TenantClient,
  links: Array<{ id: string; organizationId: string; projectId: string; objectiveId: string }>,
): Promise<void> {
  await tx.projectObjective.createMany({ data: links, skipDuplicates: true });
}
