import { expect, test, type Page } from "@playwright/test";

/**
 * e2e del modo dev-auth-mock (change dev-auth-mock). Corre contra `next dev`
 * con `AUTH_MODE=mock` y una DB efímera sembrada con los users dev. No
 * depende de Clerk: verifica picker → login (aterriza en /dashboard, el home
 * del shell), cambiar usuario y salir.
 */
async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/dashboard");
}

const nav = (page: Page) => page.locator("nav", { hasText: "Norte estratégico" });

test.describe.serial("dev auth mock", () => {
  test("el picker lista los users dev y el login resuelve la organización", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    // Landing en el home del shell con el menú y el rol del usuario.
    await expect(nav(page)).toBeVisible();
    await expect(page.getByText("Dirección", { exact: true })).toBeVisible();

    // El id dev fluye por tenancy/RLS y resuelve el member sembrado.
    await page.goto("/members");
    await expect(page.locator("li", { hasText: "ceo@ensambla.dev" })).toBeVisible();
    await expect(page.locator("li", { hasText: "Dirección" })).toBeVisible();
  });

  test("cambiar usuario reemplaza la sesión", async ({ page }) => {
    await signInAs(page, "dev_direccion");

    await page.getByRole("link", { name: "Cambiar usuario (dev)" }).click();
    await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();

    await page.getByTestId("dev-user-dev_lider").click();
    await page.waitForURL("**/dashboard");
    await expect(nav(page)).toBeVisible();
    await expect(page.getByText("Líder", { exact: true })).toBeVisible();
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
