import { execFileSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

import { DEV_AUTH_APP_URL } from "./dev-auth-setup";

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

test.describe("role-scoped executive dashboard", () => {
  test.beforeAll(() => {
    runFixture("setup");
  });

  test.afterAll(() => {
    runFixture("cleanup");
  });

  test("Dirección → Líder → Colaborador keep their own safe projection", async ({ page }) => {
    test.setTimeout(120_000);

    await signInAs(page, "dev_direccion");
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Panorama de la organización" }),
    ).toBeVisible();
    await expect(page.getByText("Avance global de OKRs")).toBeVisible();
    await expect(page.getByText("Salud de Teams", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Team Dashboard E2E", { exact: true })).toBeVisible();
    await expect(page.getByText("Acción sugerida:", { exact: false }).first()).toBeVisible();
    await expect(
      page.getByText("Contenido privado que el dashboard agregado no muestra"),
    ).toBeHidden();

    await signInAs(page, "dev_lider");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Tu Team en foco" })).toBeVisible();
    await expect(page.getByText("Team Dashboard E2E", { exact: true })).toBeVisible();
    await expect(page.getByText("Resultado protegido", { exact: false })).toBeVisible();
    await expect(page.getByText("Acción sugerida:", { exact: false }).first()).toBeVisible();
    await expect(
      page.getByText("Contenido privado que el dashboard agregado no muestra"),
    ).toBeHidden();

    await signInAs(page, "dev_colaborador");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Tu panorama personal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mis objetivos" })).toBeVisible();
    await expect(page.getByText("Mi Feedback")).toBeVisible();
    await expect(page.getByText("Mi plan de crecimiento")).toBeVisible();
    const pulses = page.locator('[data-slot="card"]', { hasText: "Pulsos pendientes" });
    await expect(pulses).toContainText("1");
    await expect(
      page.getByText("Contenido privado que el dashboard agregado no muestra"),
    ).toBeHidden();
  });
});

function runFixture(action: "setup" | "cleanup"): void {
  execFileSync("npx", ["tsx", "e2e/executive-dashboard-fixture.ts", action], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: DEV_AUTH_APP_URL },
    stdio: "pipe",
  });
}
