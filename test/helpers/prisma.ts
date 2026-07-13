import { execSync } from "node:child_process";

import { createPrismaClient, type PrismaClient } from "../../src/shared/db";

import { startEphemeralPostgres } from "./postgres";

/**
 * Ephemeral Postgres with all Prisma migrations applied (ADR-0003 / ADR-0006).
 * RLS policies live in the migrations, so tests exercise the real schema.
 */
export interface TestDatabase {
  prisma: PrismaClient;
  stop: () => Promise<void>;
}

export async function startMigratedTestDatabase(): Promise<TestDatabase> {
  const pg = await startEphemeralPostgres();
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: pg.connectionUri },
    stdio: "pipe",
  });

  // El user de testcontainers es superuser y Postgres exime a los superusers
  // de RLS (aun con FORCE). La app conecta SIEMPRE con un rol no-superuser
  // (como en producción); los tests replican eso o darían verde mintiendo.
  const admin = createPrismaClient(pg.connectionUri);
  await admin.$executeRawUnsafe(
    `CREATE ROLE ensambla_app LOGIN PASSWORD 'ensambla_app' NOSUPERUSER NOBYPASSRLS`,
  );
  await admin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ensambla_app`);
  await admin.$executeRawUnsafe(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ensambla_app`,
  );
  await admin.$disconnect();

  const appUri = new URL(pg.connectionUri);
  appUri.username = "ensambla_app";
  appUri.password = "ensambla_app";
  const prisma = createPrismaClient(appUri.toString());

  return {
    prisma,
    stop: async () => {
      await prisma.$disconnect();
      await pg.stop();
    },
  };
}
