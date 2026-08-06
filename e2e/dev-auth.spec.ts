import { expect, test, type Page } from "@playwright/test";

/**
 * e2e del modo dev-auth-mock (change dev-auth-mock). Corre contra `next dev`
 * con `AUTH_MODE=mock` y una DB efímera sembrada con los users dev. No
 * depende de Clerk: verifica picker → login, cambiar usuario y salir.
 */
async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

test.describe.serial("dev auth mock", () => {
  test("el picker lista los users dev y el login resuelve la organización", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    // El id dev fluye por tenancy/RLS y resuelve el member sembrado.
    await expect(page.locator("li", { hasText: "ceo@ensambla.dev" })).toBeVisible();
    await expect(page.locator("li", { hasText: "Dirección" })).toBeVisible();
  });

  test("cambiar usuario reemplaza la sesión", async ({ page }) => {
    await signInAs(page, "dev_direccion");

    await page.getByRole("link", { name: "Cambiar usuario (dev)" }).click();
    await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();

    await page.getByTestId("dev-user-dev_lider").click();
    await page.waitForURL("**/members");
    await expect(page.locator("li", { hasText: "lider@ensambla.dev" })).toBeVisible();
    await expect(page.locator("li", { hasText: "Líder" })).toBeVisible();
  });

  test("salir de la sesión de desarrollo deja al usuario anónimo", async ({ page }) => {
    await signInAs(page, "dev_direccion");

    await page.goto("/sign-in");
    await page.getByTestId("dev-sign-out").click();

    // Vuelve al picker sin sesión (sin botón de salir) y la home es anónima.
    await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
    await expect(page.getByTestId("dev-sign-out")).toBeHidden();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  });
});
