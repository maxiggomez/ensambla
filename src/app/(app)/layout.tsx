import { redirect } from "next/navigation";

import { AppShellView } from "./components/app-shell";
import { NAV_SECTIONS, sectionsForRole } from "./navigation";
import { resolveShellSession } from "./session";

/**
 * Shell de la app autenticada (change app-shell): sidebar + topbar aplicados
 * a todas las rutas del route group (app). Gate de auth + resolución del rol
 * del actor; la navegación se filtra por rol con los permisos de identity-org.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await resolveShellSession();
  if (!session) {
    redirect("/sign-in");
  }

  const sections = session.user.role ? sectionsForRole(session.user.role) : [];

  return (
    <AppShellView
      user={session.user}
      isMock={session.isMock}
      sections={sections}
      allSections={NAV_SECTIONS}
    >
      {children}
    </AppShellView>
  );
}
