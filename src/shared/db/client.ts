import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client";

/**
 * Prisma client factory (Prisma 7: driver adapter, no engine binary).
 * Tests pass the ephemeral Postgres URI; the app uses the singleton below.
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

let singleton: PrismaClient | undefined;

/**
 * App-wide client, created lazily from DATABASE_URL on first use so that
 * importing this module never requires the env var (e.g. in unit tests).
 */
export function prismaClient(): PrismaClient {
  if (!singleton) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    singleton = createPrismaClient(url);
  }
  return singleton;
}
