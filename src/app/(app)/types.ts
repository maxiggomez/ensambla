import type { Role } from "@/modules/identity-org/application";

/**
 * Tipos compartidos del shell. Modulo puro (solo types): lo importan tanto el
 * lado server (navigation, session, layout) como los client components, sin
 * arrastrar runtime (Prisma, identity-org).
 */

export type SectionScope = "all" | "management";

export interface NavSection {
  key: string;
  label: string;
  href: string;
  /** Id del ícono lucide, mapeado a componente en el client shell. */
  icon: string;
  scope: SectionScope;
}

export interface ShellIdentity {
  name: string;
  email: string;
  role: Role | null;
}

export interface ShellSession {
  user: ShellIdentity;
  isMock: boolean;
}
