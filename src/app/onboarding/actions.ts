"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createOrganization } from "../../modules/identity-org/application";
import { ApplicationError, DomainError } from "../../shared/errors";

export interface CreateOrgFormState {
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "identity-org/invalid-name": "El nombre de la organización no puede estar vacío.",
  "identity-org/invalid-email": "Tu usuario no tiene un email válido.",
  "identity-org/organization-exists": "Ya pertenecés a una organización.",
};

export async function createOrganizationAction(
  _prevState: CreateOrgFormState,
  formData: FormData,
): Promise<CreateOrgFormState> {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  try {
    await createOrganization({
      clerkUserId: user.id,
      name: String(formData.get("name") ?? ""),
      creatorEmail: user.primaryEmailAddress?.emailAddress ?? "",
      creatorName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Sin nombre",
    });
  } catch (error) {
    if (error instanceof DomainError || error instanceof ApplicationError) {
      return { error: ERROR_MESSAGES[error.code] ?? "No se pudo crear la organización." };
    }
    throw error;
  }

  redirect("/members");
}
