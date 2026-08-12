import { expect, test, type Page } from "@playwright/test";

/**
 * e2e del slice app-shell (mock auth). Corre contra `next dev` con
 * `AUTH_MODE=mock` y la DB efímera sembrada con "Ensambla Dev" y los users
 * dev. Cubre los Scenarios **Authenticated app navigation**,
 * **Role-based navigation** y **Logging in lands on the app home**.
 */
async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
}

const nav = (page: Page) => page.locator("nav", { hasText: "Norte estratégico" });

test.describe.serial("app shell", () => {
  test("sin sesión una ruta de app redirige a /sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  });

  test("el picker dev aterriza en /dashboard con sidebar y topbar", async ({ page }) => {
    await signInAs(page, "dev_direccion");
    await page.waitForURL("**/dashboard");
    await expect(nav(page)).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("Dirección ve Miembros y navega a los placeholders En construcción", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");
    await page.waitForURL("**/dashboard");
    await expect(nav(page).getByRole("link", { name: "Miembros" })).toBeVisible();

    for (const section of ["OKRs", "Rituales", "Skills & Staffing"]) {
      await nav(page).getByRole("link", { name: section }).click();
      await expect(page.getByText(/En construcción/)).toBeVisible();
    }
  });

  test("Líder y Colaborador no ven Miembros", async ({ page }) => {
    await signInAs(page, "dev_colaborador");
    await page.waitForURL("**/dashboard");
    await expect(nav(page).getByRole("link", { name: "Miembros" })).toBeHidden();
    await expect(nav(page).getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("un usuario dev sin miembro es dirigido a /onboarding", async ({ page }) => {
    await signInAs(page, "dev_invitado");
    await page.waitForURL("**/onboarding");
  });
});
