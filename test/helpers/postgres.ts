import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

/**
 * Ephemeral Postgres for integration tests (ADR-0006).
 *
 * Usage:
 * ```ts
 * let pg: EphemeralPostgres;
 * beforeAll(async () => { pg = await startEphemeralPostgres(); });
 * afterAll(async () => { await pg.stop(); });
 * // pg.connectionUri → pass to Prisma via DATABASE_URL
 * ```
 */
export interface EphemeralPostgres {
  connectionUri: string;
  stop: () => Promise<void>;
}

const POSTGRES_IMAGE = "postgres:17-alpine";

export async function startEphemeralPostgres(): Promise<EphemeralPostgres> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    POSTGRES_IMAGE,
  ).start();

  return {
    connectionUri: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
}
