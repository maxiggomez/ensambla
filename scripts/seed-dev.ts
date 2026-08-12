import { DEV_USERS } from "../src/lib/auth/mock-users";
import { createOrganization, inviteMember } from "../src/modules/identity-org/application";
import type { PrismaClient } from "../src/shared/db";
import { prismaClient } from "../src/shared/db";
import { linkMembershipsForUser } from "../src/shared/tenancy";

/**
 * Seed de datos dev para `AUTH_MODE=mock` (change dev-auth-mock). Crea la
 * Organization "Ensambla Dev" y sus Members con los ids sintéticos `dev_*`
 * del registro `DEV_USERS`, para que el flujo mock → tenancy/RLS sea
 * idéntico al de un usuario real. Idempotente por convención del dominio
 * (reinvitar al mismo email no duplica).
 */
export async function seedDevData(prisma: PrismaClient): Promise<void> {
  const direccion = DEV_USERS.find((u) => u.role === "Direccion");
  const rest = DEV_USERS.filter((u) => u.role !== "Direccion");
  if (!direccion) {
    throw new Error("dev-auth-mock: falta el usuario dev de Dirección en DEV_USERS");
  }

  await createOrganization(
    {
      clerkUserId: direccion.id,
      name: "Ensambla Dev",
      creatorEmail: direccion.email,
      creatorName: direccion.name,
    },
    prisma,
  );

  // Los users con `seeded: false` (dev_invitado) no reciben membership: cubren
  // el primer-login (F.1) y el redirect a /onboarding.
  for (const member of rest) {
    if (member.seeded === false) {
      continue;
    }
    await inviteMember(
      {
        actorClerkUserId: direccion.id,
        email: member.email,
        name: member.name,
        role: member.role,
      },
      prisma,
    );
    // Pre-vincula el member a su id dev: el login mock resuelve el tenant de
    // inmediato, sin pasar por el flujo de primer login (F.1).
    await linkMembershipsForUser(member.id, member.email, prisma);
  }
}

async function main() {
  const prisma = prismaClient();
  await seedDevData(prisma);
  await prisma.$disconnect();
  console.log("Seed dev listo: Ensambla Dev + users dev preseteado.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
