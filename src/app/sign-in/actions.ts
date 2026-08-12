"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { nextCookieStore } from "@/lib/auth/cookies";
import { clearMockSessionUserId, setMockSessionUserId } from "@/lib/auth/session";

export interface DevAuthFormState {
  error?: string;
}

export async function selectDevUserAction(
  _prevState: DevAuthFormState,
  formData: FormData,
): Promise<DevAuthFormState> {
  const userId = String(formData.get("userId") ?? "");
  try {
    setMockSessionUserId(await nextCookieStore(), userId);
  } catch {
    return { error: "Usuario de desarrollo inválido." };
  }
  revalidatePath("/");
  redirect("/dashboard");
}

export async function signOutDevAction(): Promise<void> {
  clearMockSessionUserId(await nextCookieStore());
  revalidatePath("/");
  redirect("/sign-in");
}
