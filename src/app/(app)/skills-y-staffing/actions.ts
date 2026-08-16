"use server";

import { getAuthContext } from "@/lib/auth";
import { setMemberSeniority } from "@/modules/identity-org/application";
import {
  addSkillRequirement,
  defineSkill,
  renameSkill,
  setCompetency,
} from "@/modules/skills-matrix/application";
import { ApplicationError, DomainError } from "@/shared/errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseAddSkillRequirementForm,
  parseDefineSkillForm,
  parseRenameSkillForm,
  parseSetCompetencyForm,
  parseSetSeniorityForm,
} from "./form-input";

export interface SkillsFormState {
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
): Promise<SkillsFormState> {
  try {
    await action(await actorId());
    revalidatePath("/skills-y-staffing");
    return { success };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function defineSkillAction(
  _state: SkillsFormState,
  formData: FormData,
): Promise<SkillsFormState> {
  return run(async (actorClerkUserId) => {
    await defineSkill({ actorClerkUserId, ...parseDefineSkillForm(formData) });
  }, "Skill creada.");
}

export async function renameSkillAction(
  _state: SkillsFormState,
  formData: FormData,
): Promise<SkillsFormState> {
  return run(async (actorClerkUserId) => {
    await renameSkill({ actorClerkUserId, ...parseRenameSkillForm(formData) });
  }, "Skill renombrada.");
}

export async function setCompetencyAction(
  _state: SkillsFormState,
  formData: FormData,
): Promise<SkillsFormState> {
  return run(async (actorClerkUserId) => {
    await setCompetency({ actorClerkUserId, ...parseSetCompetencyForm(formData) });
  }, "Competencia registrada.");
}

export async function setSeniorityAction(
  _state: SkillsFormState,
  formData: FormData,
): Promise<SkillsFormState> {
  return run(async (actorClerkUserId) => {
    await setMemberSeniority({ actorClerkUserId, ...parseSetSeniorityForm(formData) });
  }, "Seniority guardada.");
}

export async function addSkillRequirementAction(
  _state: SkillsFormState,
  formData: FormData,
): Promise<SkillsFormState> {
  return run(async (actorClerkUserId) => {
    const { skillId, needType, needId } = parseAddSkillRequirementForm(formData);
    await addSkillRequirement({
      actorClerkUserId,
      skillId,
      ...(needType === "project" ? { projectId: needId } : { keyResultId: needId }),
    });
  }, "Requisito agregado.");
}
