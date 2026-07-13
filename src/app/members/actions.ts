"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { inviteMember, ROLES, type Role } from "../../modules/identity-org/application";

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const role = String(formData.get("role") ?? "");
  if (!(ROLES as readonly string[]).includes(role)) {
    throw new Error(`Rol inválido: ${role}`);
  }

  await inviteMember({
    actorClerkUserId: userId,
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: role as Role,
  });

  revalidatePath("/members");
}
