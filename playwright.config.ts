import fs from "node:fs";

import { defineConfig, devices } from "@playwright/test";

import { E2E_APP_DATABASE_URL } from "./e2e/env";

// Playwright no carga .env.local (Next sí): las keys de Clerk para el e2e
// salen de ahí en local y de secrets en CI.
if (fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    // Puerto propio: jamás reusar un dev server local (tendría otro DATABASE_URL).
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // Postgres efímero de e2e (puerto fijo; lo levanta e2e/global-setup.ts).
      DATABASE_URL: E2E_APP_DATABASE_URL,
    },
  },
});
