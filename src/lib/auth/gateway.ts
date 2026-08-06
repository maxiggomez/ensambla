import type { User } from "@clerk/nextjs/server";

import { findMockUserById, mockUserAsClerkUser } from "./mock-users";
import { getMockSessionUserId, type CookieStore } from "./session";

export interface AuthContext {
  userId: string | null;
}

/**
 * Gateway de auth (change dev-auth-mock). La app consume solo `currentUser()`
 * (shape `User` que usa `verifiedEmail`) y `auth()` (`{ userId }` opaco). El
 * mock implementa exactamente ese contrato a partir de la sesión por cookie;
 * la impl de Clerk es la de siempre (wrappers de @clerk/nextjs/server).
 */
export interface AuthGateway {
  currentUser(): Promise<User | null>;
  auth(): Promise<AuthContext>;
}

export function createMockGateway(store: CookieStore): AuthGateway {
  return {
    async currentUser() {
      const id = getMockSessionUserId(store);
      if (id === undefined) {
        return null;
      }
      const user = findMockUserById(id);
      return user ? mockUserAsClerkUser(user) : null;
    },
    async auth() {
      const id = getMockSessionUserId(store);
      return { userId: id ?? null };
    },
  };
}
