"use client";

import { esES } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Provider de auth según el modo (change dev-auth-mock). En modo mock no se
 * carga Clerk en absoluto (ni su script); en cualquier otro modo se usa
 * ClerkProvider como siempre.
 */
export function AuthProvider({ mock, children }: { mock: boolean; children: ReactNode }) {
  if (mock) {
    return <>{children}</>;
  }
  return <ClerkProvider localization={esES}>{children}</ClerkProvider>;
}
