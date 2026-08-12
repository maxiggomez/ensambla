import { defineConfig, devices } from "@playwright/test";

import { DEV_AUTH_APP_URL } from "./e2e/dev-auth-setup";

// Playwright no carga .env.local (Next sí); el modo mock no necesita keys de
// Clerk, así que no hay nada que propagar acá.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(dev-auth|app-shell|strategy-northstar)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/dev-auth-setup.ts",
  use: {
    // Puerto propio: jamás reusar el server del e2e principal (3100).
    baseURL: "http://localhost:3101",
    navigationTimeout: 120_000,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "AUTH_MODE=mock npm run dev -- --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: DEV_AUTH_APP_URL,
    },
  },
});
