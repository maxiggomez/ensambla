import { auth as clerkAuth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";

import { nextCookieStore } from "./cookies";
import { createMockGateway } from "./gateway";
import { resolveAuthMode, type AuthMode } from "./mode";

function currentEnv() {
  return { NODE_ENV: process.env.NODE_ENV, AUTH_MODE: process.env.AUTH_MODE };
}

/**
 * Modo de auth vigente (change dev-auth-mock). En producción siempre `clerk`;
 * el mock es exclusivo de desarrollo local con `AUTH_MODE=mock`.
 */
export function getAuthMode(): AuthMode {
  return resolveAuthMode(currentEnv());
}

/**
 * API pública del gateway de auth (change dev-auth-mock). Reemplaza los usos
 * directos de `@clerk/nextjs/server` en la app; en modo mock la sesión es la
 * cookie de desarrollo y en el resto de los modos delega a Clerk.
 */
export async function getCurrentUser() {
  if (getAuthMode() === "mock") {
    return createMockGateway(await nextCookieStore()).currentUser();
  }
  return clerkCurrentUser();
}

export async function getAuthContext() {
  if (getAuthMode() === "mock") {
    return createMockGateway(await nextCookieStore()).auth();
  }
  return clerkAuth();
}
