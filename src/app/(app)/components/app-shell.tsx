"use client";

import { usePathname } from "next/navigation";

import type { NavSection, ShellIdentity } from "../types";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Vistas del shell (client): sidebar 248px + topbar 64px + contenido. El
 * título activo se resuelve contra todas las secciones (un Colaborador puede
 * estar en /members sin tener el item en el nav).
 */
export function AppShellView({
  user,
  isMock,
  sections,
  allSections,
  children,
}: {
  user: ShellIdentity;
  isMock: boolean;
  sections: readonly NavSection[];
  allSections: readonly NavSection[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = allSections.find((section) => section.href === pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} isMock={isMock} sections={sections} pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar activeTitle={active?.label ?? ""} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
