/**
 * Shared e2e environment. The app connects to the ephemeral Postgres with a
 * fixed host port and a non-superuser role (RLS parity with production);
 * static URLs keep playwright.config independent from global-setup ordering.
 */
export const E2E_PG_HOST_PORT = 54329;
export const E2E_ADMIN_DATABASE_URL = `postgresql://test:test@localhost:${E2E_PG_HOST_PORT}/test`;
export const E2E_APP_DATABASE_URL = `postgresql://ensambla_app:ensambla_app@localhost:${E2E_PG_HOST_PORT}/test`;

const DUMMY_SECRET = "sk_test_dummy_ci_only";

/** Real Clerk keys present (e2e with login can run). */
export function hasRealClerkKeys(): boolean {
  const secret = process.env.CLERK_SECRET_KEY;
  return Boolean(secret) && secret !== DUMMY_SECRET;
}
