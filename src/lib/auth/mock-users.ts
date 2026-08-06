import type { User } from "@clerk/nextjs/server";

/**
 * Usuarios de desarrollo preseteados para `AUTH_MODE=mock` (ver change
 * dev-auth-mock). Son identidades sintéticas: ids `dev_*` (nunca chocan con
 * ids reales de Clerk), emails verificados y un rol que matchea el seed de
 * datos dev (scripts/seed-dev.ts).
 */
export type DevRole = "Direccion" | "Lider" | "Colaborador";

export interface MockDevUser {
  id: string;
  email: string;
  name: string;
  role: DevRole;
}

export const DEV_USERS: readonly MockDevUser[] = [
  {
    id: "dev_direccion",
    email: "ceo@ensambla.dev",
    name: "Ceo Dev",
    role: "Direccion",
  },
  {
    id: "dev_lider",
    email: "lider@ensambla.dev",
    name: "Lider Dev",
    role: "Lider",
  },
  {
    id: "dev_colaborador",
    email: "colaborador@ensambla.dev",
    name: "Colaborador Dev",
    role: "Colaborador",
  },
];

export function findMockUserById(id: string): MockDevUser | undefined {
  return DEV_USERS.find((user) => user.id === id);
}

/**
 * Expone un usuario dev con el shape que la app consume de Clerk (lo que lee
 * `verifiedEmail` y los call sites: id opaco, email primario verificado,
 * fullName). El email SIEMPRE va verificado para que la vinculación por email
 * (F.1) y el gate de `verifiedEmail` operen igual que con un usuario real.
 */
export function mockUserAsClerkUser(user: MockDevUser): User {
  const verified = { verification: { status: "verified" as const } };
  return {
    id: user.id,
    primaryEmailAddress: { emailAddress: user.email, ...verified },
    emailAddresses: [{ emailAddress: user.email, ...verified }],
    fullName: user.name,
  } as unknown as User;
}
