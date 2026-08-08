import { canEditOrganization, type Role } from "@/modules/identity-org/application";

import type { NavSection } from "./types";

/**
 * Secciones del producto (app-shell). El sidebar se construye a partir de
 * esta config: cuando una capability llega, su página reemplaza al placeholder
 * y — si es una sección nueva — se agrega acá.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "layout-dashboard",
    scope: "all",
  },
  {
    key: "norte-estrategico",
    label: "Norte estratégico",
    href: "/norte-estrategico",
    icon: "compass",
    scope: "all",
  },
  {
    key: "okrs",
    label: "OKRs",
    href: "/okrs",
    icon: "target",
    scope: "all",
  },
  {
    key: "equipos-y-proyectos",
    label: "Equipos & Proyectos",
    href: "/equipos-y-proyectos",
    icon: "users",
    scope: "management",
  },
  {
    key: "rituales",
    label: "Rituales",
    href: "/rituales",
    icon: "calendar-clock",
    scope: "all",
  },
  {
    key: "feedback-y-carrera",
    label: "Feedback & Carrera",
    href: "/feedback-y-carrera",
    icon: "message-square",
    scope: "all",
  },
  {
    key: "clima",
    label: "Clima & eNPS",
    href: "/culture-enps",
    icon: "heart-pulse",
    scope: "all",
  },
  {
    key: "motor-lean",
    label: "Motor Lean",
    href: "/motor-lean",
    icon: "flask-conical",
    scope: "all",
  },
  {
    key: "skills-y-staffing",
    label: "Skills & Staffing",
    href: "/skills-y-staffing",
    icon: "grid-2x2",
    scope: "management",
  },
  {
    key: "miembros",
    label: "Miembros",
    href: "/members",
    icon: "contact",
    scope: "management",
  },
];

/**
 * Filtro de secciones por rol (spec "Role-based navigation"). Reutiliza la
 * policy de permisos de identity-org (canEditOrganization); no define policy
 * nueva.
 *
 * - Dirección (canEditOrganization): todas las secciones.
 * - Líder: todas las secciones (el contenido se acota a su Team cuando las
 *   capabilities de teams lleguen; el nav no se reduce).
 * - Colaborador: solo su alcance — se ocultan las secciones de gestión.
 */
export function sectionsForRole(role: Role): readonly NavSection[] {
  if (canEditOrganization(role)) {
    return NAV_SECTIONS;
  }
  if (role === "Lider") {
    return NAV_SECTIONS;
  }
  return NAV_SECTIONS.filter((section) => section.scope !== "management");
}
