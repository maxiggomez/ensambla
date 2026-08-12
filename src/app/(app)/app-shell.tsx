"use client";

import {
  Compass,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  RefreshCcw,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { Role } from "@/modules/identity-org/application";

export interface ShellSection {
  slug: string;
  label: string;
  href: string;
}

interface AppShellProps {
  sections: ShellSection[];
  role: Role;
  userName: string;
  userEmail: string;
  isMock: boolean;
  children: ReactNode;
}

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  north: Compass,
  okrs: Target,
  teams: Users,
  rituals: RefreshCcw,
  feedback: MessageSquare,
  culture: HeartPulse,
  lean: FlaskConical,
  skills: LayoutGrid,
  members: UserRound,
};

const ROLE_LABELS: Record<Role, string> = {
  Direccion: "Dirección",
  Lider: "Líder",
  Colaborador: "Colaborador",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({
  sections,
  role,
  userName,
  userEmail,
  isMock,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const active = sections.find(
    (section) => pathname === section.href || pathname.startsWith(`${section.href}/`),
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-[248px] shrink-0 flex-col bg-deep text-background">
        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5 font-bold">
          <span className="grid size-9 place-items-center rounded-full bg-brand text-xs tracking-tight text-ink">
            En
          </span>
          Ensambla
        </Link>
        <nav aria-label="Secciones del producto" className="flex-1 space-y-1 px-3 pb-4">
          {sections.map((section) => {
            const Icon = ICONS[section.slug];
            const isActive =
              pathname === section.href || pathname.startsWith(`${section.href}/`);
            return (
              <Link
                key={section.slug}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "flex items-center gap-3 rounded-md bg-brand px-3 py-2 text-sm font-bold text-ink"
                    : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-background/80 hover:bg-background/10 hover:text-background"
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 border-t border-background/10 px-5 py-4">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-background/15 text-xs font-extrabold text-background"
          >
            {initials(userName)}
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-bold">{userName}</p>
            <p className="truncate text-background/60">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        {isMock ? (
          <Link
            href="/sign-in"
            className="px-5 pb-4 text-xs text-background/60 underline hover:text-background"
          >
            Cambiar usuario (dev)
          </Link>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 md:px-8">
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.13em] uppercase text-muted-foreground">
              Ensambla
            </p>
            <p className="truncate text-sm font-bold text-muted-foreground">
              {active?.label ?? userName}
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-ink sm:flex">
            {ROLE_LABELS[role]}
            <span aria-hidden className="text-muted">
              · {userEmail}
            </span>
          </span>
        </header>
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
