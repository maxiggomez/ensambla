import { execSync } from "node:child_process";

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

/** Puerto host fijo para que playwright config no dependa del orden del setup. */
export const DEV_AUTH_PG_HOST_PORT = 54330;
export const DEV_AUTH_DB_NAME = "test";
export const DEV_AUTH_ADMIN_URL = `postgresql://test:test@localhost:${DEV_AUTH_PG_HOST_PORT}/${DEV_AUTH_DB_NAME}`;
export const DEV_AUTH_APP_URL = `postgresql://ensambla_app:ensambla_app@localhost:${DEV_AUTH_PG_HOST_PORT}/${DEV_AUTH_DB_NAME}`;

/**
 * e2e del modo dev-auth-mock: Postgres efímero (migraciones + RLS) sembrado
 * con los users dev (`scripts/seed-dev.ts`). Independiente de Clerk: no
 * necesita keys reales. El app server corre en `next dev` con `AUTH_MODE=mock`.
 */
export default async function devAuthGlobalSetup(): Promise<(() => Promise<void>) | undefined> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    "postgres:17-alpine",
  )
    .withExposedPorts({ container: 5432, host: DEV_AUTH_PG_HOST_PORT })
    .start();

  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: DEV_AUTH_ADMIN_URL },
      stdio: "pipe",
    });

    // Mismo rol no-superuser que producción (superusers bypassean RLS).
    execSync("npx prisma db execute --stdin", {
      env: { ...process.env, DATABASE_URL: DEV_AUTH_ADMIN_URL },
      input: [
        `CREATE ROLE ensambla_app LOGIN PASSWORD 'ensambla_app' NOSUPERUSER NOBYPASSRLS;`,
        `GRANT USAGE ON SCHEMA public TO ensambla_app;`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ensambla_app;`,
      ].join("\n"),
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Seed: org "Ensambla Dev" + members con ids dev_* (vía app layer + RLS).
    execSync("npx tsx scripts/seed-dev.ts", {
      env: { ...process.env, DATABASE_URL: DEV_AUTH_APP_URL },
      stdio: "pipe",
    });

    return async () => {
      await container.stop();
    };
  } catch (error) {
    // Un fallo del setup no puede dejar el container huérfano en el puerto fijo.
    await container.stop();
    throw error;
  }
}
