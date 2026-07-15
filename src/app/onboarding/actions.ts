"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createOrganization } from "../../modules/identity-org/application";

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  await createOrganization({
    clerkUserId: user.id,
    name: String(formData.get("name") ?? ""),
    creatorEmail: user.primaryEmailAddress?.emailAddress ?? "",
    creatorName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Sin nombre",
  });

  redirect("/members");
}
