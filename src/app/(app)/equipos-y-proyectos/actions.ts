"use server";

import { getAuthContext } from "@/lib/auth";
import {
  assignTeamMember,
  closeProject,
  createProject,
  createTeam,
  linkProjectToObjectives,
  updateTeam,
} from "@/modules/teams-staffing/application";
import { ApplicationError, DomainError } from "@/shared/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseAssignTeamMemberForm,
  parseCreateProjectForm,
  parseCreateTeamForm,
  parseLinkProjectForm,
  parseProjectIdentityForm,
  parseUpdateTeamForm,
} from "./form-input";

export interface TeamsFormState {
  error?: string;
  success?: string;
}

async function actorId(): Promise<string> {
  const { userId } = await getAuthContext();
  if (!userId) redirect("/sign-in");
  return userId;
}

function messageFor(error: unknown): string {
  if (error instanceof DomainError || error instanceof ApplicationError) return error.message;
  return "No se pudo completar la acción";
}

async function run(
  action: (actorClerkUserId: string) => Promise<void>,
  success: string,
): Promise<TeamsFormState> {
  try {
    await action(await actorId());
    revalidatePath("/equipos-y-proyectos");
    return { success };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function createTeamAction(
  _state: TeamsFormState,
  formData: FormData,
): Promise<TeamsFormState> {
  return run(async (actorClerkUserId) => {
    await createTeam({ actorClerkUserId, ...parseCreateTeamForm(formData) });
  }, "Equipo creado.");
}

export async function updateTeamAction(
  _state: TeamsFormState,
  formData: FormData,
): Promise<TeamsFormState> {
  return run(async (actorClerkUserId) => {
    await updateTeam({ actorClerkUserId, ...parseUpdateTeamForm(formData) });
  }, "Equipo actualizado.");
}

export async function assignTeamMemberAction(
  _state: TeamsFormState,
  formData: FormData,
): Promise<TeamsFormState> {
  return run(async (actorClerkUserId) => {
    await assignTeamMember({
      actorClerkUserId,
      ...parseAssignTeamMemberForm(formData),
    });
  }, "Miembro asignado.");
}

export async function createProjectAction(
  _state: TeamsFormState,
  formData: FormData,
): Promise<TeamsFormState> {
  return run(async (actorClerkUserId) => {
    await createProject({ actorClerkUserId, ...parseCreateProjectForm(formData) });
  }, "Proyecto creado.");
}

export async function linkProjectToObjectivesAction(
  _state: TeamsFormState,
  formData: FormData,
): Promise<TeamsFormState> {
  return run(async (actorClerkUserId) => {
    const { projectId, objectiveId } = parseLinkProjectForm(formData);
    await linkProjectToObjectives({
      actorClerkUserId,
      projectId,
      objectiveIds: [objectiveId],
    });
  }, "Objetivo vinculado.");
}

export async function closeProjectAction(
  _state: TeamsFormState,
  formData: FormData,
): Promise<TeamsFormState> {
  return run(async (actorClerkUserId) => {
    await closeProject({ actorClerkUserId, ...parseProjectIdentityForm(formData) });
  }, "Proyecto cerrado.");
}
