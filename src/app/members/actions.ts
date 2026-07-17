"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { inviteMember, ROLES, type Role } from "../../modules/identity-org/application";
import { ApplicationError, DomainError } from "../../shared/errors";

export interface InviteFormState {
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "identity-org/invalid-email": "El email no es válido.",
  "identity-org/invalid-member-name": "El nombre no puede estar vacío.",
  "identity-org/forbidden": "Solo Dirección puede invitar miembros.",
  "tenancy/no-member": "Tu usuario no pertenece a ninguna organización.",
};

export async function inviteMemberAction(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const role = String(formData.get("role") ?? "");
  if (!(ROLES as readonly string[]).includes(role)) {
    return { error: "Rol inválido." };
  }

  try {
    await inviteMember({
      actorClerkUserId: userId,
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      role: role as Role,
    });
  } catch (error) {
    // Errores esperados de dominio/aplicación → mensaje amigable en el form;
    // lo inesperado se relanza (error boundary de Next).
    if (error instanceof DomainError || error instanceof ApplicationError) {
      return { error: ERROR_MESSAGES[error.code] ?? "No se pudo completar la invitación." };
    }
    throw error;
  }

  revalidatePath("/members");
  return {};
}
