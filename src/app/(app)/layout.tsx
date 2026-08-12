import { getAuthMode, getCurrentUser } from "@/lib/auth";
import { verifiedEmail } from "@/lib/verified-email";
import { listMembers, type Role } from "@/modules/identity-org/application";
import { ApplicationError } from "@/shared/errors";
import { linkMembershipsForUser } from "@/shared/tenancy";
import { redirect } from "next/navigation";

import { AppShell } from "./app-shell";
import { sectionsForRole } from "./sections";

/*
 * Shell de la app autenticada (app-shell). Guard aquí (no por página): sin
 * sesión → /sign-in; sin miembro → /onboarding. La navegación por rol la
 * decide `sectionsForRole` con el permiso existente de identity-org.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  let members = await listMembers({ actorClerkUserId: user.id }).catch((error) => {
    if (error instanceof ApplicationError && error.code === "tenancy/no-member") {
      return null;
    }
    throw error;
  });
  if (members === null) {
    const linked = await linkMembershipsForUser(user.id, verifiedEmail(user));
    if (linked === 0) redirect("/onboarding");
    members = await listMembers({ actorClerkUserId: user.id });
  }

  const actor = members.find((member) => member.clerkUserId === user.id);
  if (!actor) redirect("/onboarding");

  return (
    <AppShell
      sections={sectionsForRole(actor.role as Role)}
      role={actor.role as Role}
      userName={actor.name}
      userEmail={verifiedEmail(user)}
      isMock={getAuthMode() === "mock"}
    >
      {children}
    </AppShell>
  );
}
