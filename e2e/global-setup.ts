import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { createClerkClient } from "@clerk/backend";
import { clerkSetup } from "@clerk/testing/playwright";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

import { E2E_ADMIN_DATABASE_URL, E2E_PG_HOST_PORT, hasRealClerkKeys } from "./env";

/**
 * e2e setup (foundation 6.3): ephemeral Postgres with migrations + RLS and a
 * disposable Clerk test user. Skipped entirely without real Clerk keys — the
 * identity spec skips itself and the smoke test needs no DB.
 */
export default async function globalSetup(): Promise<(() => Promise<void>) | undefined> {
  if (!hasRealClerkKeys()) {
    return undefined;
  }

  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    "postgres:17-alpine",
  )
    .withExposedPorts({ container: 5432, host: E2E_PG_HOST_PORT })
    .start();

  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: E2E_ADMIN_DATABASE_URL },
      stdio: "pipe",
    });

    // Same non-superuser role as the integration helper: superusers bypass RLS.
    // Via CLI to avoid importing the generated Prisma client (ESM) in this file.
    execSync("npx prisma db execute --stdin", {
      env: { ...process.env, DATABASE_URL: E2E_ADMIN_DATABASE_URL },
      input: [
        `CREATE ROLE ensambla_app LOGIN PASSWORD 'ensambla_app' NOSUPERUSER NOBYPASSRLS;`,
        `GRANT USAGE ON SCHEMA public TO ensambla_app;`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ensambla_app;`,
      ].join("\n"),
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Testing token (bypasses bot protection) + disposable test user.
    // `+clerk_test` marks it as a Clerk test identity (no real emails sent;
    // sign-in is via email_code, so no password needed).
    await clerkSetup();
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const email = `e2e+clerk_test@example.com`;

    // Self-heal: a crashed run (no teardown) leaves the user behind and the
    // fixed email would collide forever; delete any leftover first.
    const leftovers = await clerk.users.getUserList({ emailAddress: [email] });
    for (const leftover of leftovers.data) {
      await clerk.users.deleteUser(leftover.id);
    }

    const user = await clerk.users.createUser({
      emailAddress: [email],
      // La instancia exige password al crear; el login del e2e igual va por
      // email_code, así que este valor no se usa ni se exporta.
      password: `E2e!${randomBytes(12).toString("hex")}`,
      firstName: "Ana",
      lastName: "E2E",
    });
    process.env.E2E_CLERK_USER_EMAIL = email;

    return async () => {
      try {
        await clerk.users.deleteUser(user.id);
      } finally {
        // Pase lo que pase con Clerk, el container no queda huérfano en 54329.
        await container.stop();
      }
    };
  } catch (error) {
    // Sin esto, un fallo del setup deja el container vivo y la próxima corrida
    // muere con "port is already allocated".
    await container.stop();
    throw error;
  }
}
