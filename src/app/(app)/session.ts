import { getAuthMode, getCurrentUser } from "@/lib/auth";
import { findMockUserById } from "@/lib/auth/mock-users";
import { listMembers } from "@/modules/identity-org/application";
import type { Role } from "@/modules/identity-org/application";
import { ApplicationError } from "@/shared/errors";
import { verifiedEmail } from "@/lib/verified-email";

import type { ShellSession } from "./types";

function isNoMember(error: unknown): boolean {
  return error instanceof ApplicationError && error.code === "tenancy/no-member";
}

/**
 * Resuelve la identidad del shell para el request autenticado.
 *
 * - Modo mock (dev-auth): el rol sale del registro DEV_USERS, sin tocar la DB
 *   (los e2e de app-shell son de navegación/render y no dependen de Prisma).
 * - Clerk: el rol sale de la membership del actor (identity-org). Si todavía
 *   no hay membership, el shell no bloquea: la página (ej. /members) resuelve
 *   la vinculación por email (F.1) o redirige a /onboarding.
 *
 * Devuelve `null` solo si no hay usuario autenticado (el layout redirige).
 */
export async function resolveShellSession(): Promise<ShellSession | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (getAuthMode() === "mock") {
    const dev = findMockUserById(user.id);
    if (!dev) {
      return null;
    }
    return {
      user: { name: dev.name, email: dev.email, role: dev.role },
      isMock: true,
    };
  }

  let role: Role | null = null;
  try {
    const members = await listMembers({ actorClerkUserId: user.id });
    const actor = members.find((member) => member.clerkUserId === user.id);
    role = (actor?.role as Role | undefined) ?? null;
  } catch (error) {
    if (!isNoMember(error)) {
      throw error;
    }
  }

  return {
    user: { name: user.fullName ?? "", email: verifiedEmail(user), role },
    isMock: false,
  };
}
