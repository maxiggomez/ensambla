import { execFileSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

import { DEV_AUTH_APP_URL } from "./dev-auth-setup";

async function enterAsNewDirection(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId("dev-user-dev_onboarding").click();
  await page.waitForURL("**/onboarding");
  await expect(page.getByRole("heading", { name: "Creá tu organización" })).toBeVisible();
}

async function createOrganization(page: Page, name: string): Promise<void> {
  await page.getByLabel("Nombre de la organización").fill(name);
  await page.getByRole("button", { name: "Crear organización" }).click();
  await page.waitForURL("**/onboarding");
  await expect(page.getByRole("heading", { name: "Contanos sobre tu empresa" })).toBeVisible();
}

test.describe.serial("guided onboarding setup", () => {
  test.beforeEach(() => runFixture("cleanup"));
  test.afterEach(() => runFixture("cleanup"));

  test("new Organization → profile → review → Back restoration → Finish", async ({ page }) => {
    await enterAsNewDirection(page);
    await createOrganization(page, "Onboarding Finish E2E");

    await page.getByLabel("Tipo de empresa").fill("Servicios profesionales");
    await page.getByLabel("Industria").fill("Tecnología");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Revisá tu configuración" })).toBeVisible();
    await expect(page.getByText("Servicios profesionales", { exact: true })).toBeVisible();
    await expect(page.getByText("Tecnología", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Volver" }).click();
    await expect(page.getByLabel("Tipo de empresa")).toHaveValue("Servicios profesionales");
    await expect(page.getByLabel("Industria")).toHaveValue("Tecnología");

    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Finalizar configuración" }).click();
    await page.waitForURL("**/members");
    runFixture("assert-empty");

    await page.goto("/onboarding");
    await page.waitForURL("**/members");
  });

  test("Skip enters an empty app and does not force onboarding later", async ({ page }) => {
    await enterAsNewDirection(page);
    await createOrganization(page, "Onboarding Skip E2E");

    await page.getByRole("button", { name: "Saltar configuración" }).click();
    await page.waitForURL("**/members");
    runFixture("assert-empty");

    await page.goto("/onboarding");
    await page.waitForURL("**/members");
  });

  test("non-Dirección never receives pending setup controls", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
    await page.getByTestId("dev-user-dev_lider").click();
    await page.waitForURL("**/members");

    await page.goto("/onboarding");
    await page.waitForURL("**/members");
    await expect(page.getByRole("heading", { name: "Contanos sobre tu empresa" })).toBeHidden();
  });
});

function runFixture(action: "cleanup" | "assert-empty"): void {
  execFileSync("npx", ["tsx", "e2e/onboarding-setup-fixture.ts", action], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: DEV_AUTH_APP_URL },
    stdio: "pipe",
  });
}
