import { findMockUserById } from "./mock-users";

export const DEV_SESSION_COOKIE = "ensambla_dev_user";

/**
 * Adaptador mínimo de cookie store para poder testear la sesión sin el
 * runtime de Next. En la app se construye desde `next/headers` (cookies()).
 */
export interface CookieOptions {
  httpOnly: boolean;
  path: string;
  maxAge: number;
}

export interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  delete(name: string, options: { path: string }): void;
}

function readSessionId(store: CookieStore): string | undefined {
  return store.get(DEV_SESSION_COOKIE);
}

function sessionOptions(): CookieOptions {
  return { httpOnly: true, path: "/", maxAge: 60 * 60 * 8 };
}

/**
 * Sesión mock: la cookie guarda el id del usuario dev preseteado. Solo admite
 * ids del registro `DEV_USERS` — nunca se puede inventar una sesión con un id
 * arbitrario.
 */
export function setMockSessionUserId(store: CookieStore, id: string): void {
  const user = findMockUserById(id);
  if (!user) {
    throw new Error(`dev-auth-mock/unknown-user: "${id}" no es un usuario dev preseteado`);
  }
  store.set(DEV_SESSION_COOKIE, user.id, sessionOptions());
}

export function getMockSessionUserId(store: CookieStore): string | undefined {
  const id = readSessionId(store);
  if (id === undefined) {
    return undefined;
  }
  return findMockUserById(id)?.id;
}

export function clearMockSessionUserId(store: CookieStore): void {
  store.delete(DEV_SESSION_COOKIE, { path: "/" });
}
