"use client";

import {
  CalendarClock,
  Compass,
  Contact,
  FlaskConical,
  Grid2x2,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { AvatarFallback, AvatarRoot } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import type { NavSection, ShellIdentity } from "../types";

/**
 * Mapeo id → componente lucide. Los ids viven en `navigation.ts` (server); el
 * client solo convierte el id que recibe por props (nada de refs de
 * componentes cruzando la frontera server→client).
 */
const SECTION_ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  compass: Compass,
  target: Target,
  users: Users,
  "calendar-clock": CalendarClock,
  "message-square": MessageSquare,
  "heart-pulse": HeartPulse,
  "flask-conical": FlaskConical,
  "grid-2x2": Grid2x2,
  contact: Contact,
};

const ROLE_LABELS: Record<string, string> = {
  Direccion: "Dirección",
  Lider: "Líder",
  Colaborador: "Colaborador",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar({
  user,
  isMock,
  sections,
  pathname,
}: {
  user: ShellIdentity;
  isMock: boolean;
  sections: readonly NavSection[];
  pathname: string;
}) {
  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="size-2.5 shrink-0 rounded-full bg-brand" aria-hidden />
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight">Ensambla</p>
          <p className="text-[11px] font-bold tracking-[0.13em] text-sidebar-foreground/60 uppercase">
            Alignment OS
          </p>
        </div>
      </div>

      <nav aria-label="Secciones del producto" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.icon] ?? LayoutDashboard;
            const isActive = pathname === section.href;
            return (
              <li key={section.key}>
                <Link
                  href={section.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-brand font-extrabold text-ink"
                      : "font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span>{section.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div data-testid="shell-identity" className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <AvatarRoot>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </AvatarRoot>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {ROLE_LABELS[user.role ?? ""] ?? ""}
            </p>
          </div>
        </div>
        {isMock ? (
          <Link
            href="/sign-in"
            className="mt-3 inline-block text-xs font-bold text-sidebar-foreground/70 underline underline-offset-4 hover:text-sidebar-foreground"
          >
            Cambiar usuario (dev)
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
