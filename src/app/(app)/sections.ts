import { canManageMembers, type Role } from "../../modules/identity-org/application";

/**
 * Registro de secciones del producto (app-shell). Cada sección conoce su ruta y
 * si es de gestión (managementOnly). La visibilidad por rol la decide el
 * permiso existente de identity-org (canManageMembers) — no hay política nueva.
 * Los íconos se resuelven en el cliente por `slug` (ver `app-shell.tsx`): no se
 * pasan componentes de servidor a cliente.
 */
export interface AppSection {
  slug: string;
  label: string;
  href: string;
  managementOnly?: boolean;
}

export const SECTIONS: readonly AppSection[] = [
  { slug: "dashboard", label: "Dashboard", href: "/dashboard" },
  {
    slug: "north",
    label: "Norte estratégico",
    href: "/strategy-northstar",
  },
  { slug: "okrs", label: "OKRs", href: "/okrs" },
  {
    slug: "teams",
    label: "Equipos & Proyectos",
    href: "/teams",
  },
  { slug: "rituals", label: "Rituales", href: "/rituals" },
  {
    slug: "feedback",
    label: "Feedback & Carrera",
    href: "/feedback",
  },
  {
    slug: "culture",
    label: "Clima & eNPS",
    href: "/culture-enps",
  },
  { slug: "lean", label: "Motor Lean", href: "/lean" },
  {
    slug: "skills",
    label: "Skills & Staffing",
    href: "/skills",
  },
  {
    slug: "members",
    label: "Miembros",
    href: "/members",
    managementOnly: true,
  },
];

/** Secciones que un rol puede ver: la de gestión solo para quien la maneja. */
export function sectionsForRole(role: Role): AppSection[] {
  return SECTIONS.filter((section) => !section.managementOnly || canManageMembers(role));
}
