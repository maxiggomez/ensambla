import { expect, test, type Page } from "@playwright/test";

/**
 * e2e del contenedor de página estándar (change page-padding-consistency):
 * norte-estrategico, okrs y dashboard deben renderizar el mismo container
 * que el resto de la app (rituales de referencia): main centrado con
 * max-width 1180px y padding uniforme px-6 md:px-10 / py-10, sin quedar
 * pegadas a la sidebar ni a la topbar. Corre con mock auth (AUTH_MODE=mock).
 */
async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

async function expectStandardPageContainer(page: Page): Promise<void> {
  // Viewport ancho (1600px) para que el área de contenido supere los 1180px y
  // el container de la página quede centrado con margen auto observable.
  await page.setViewportSize({ width: 1600, height: 900 });
  const main = page.locator("main");
  await expect(main).toHaveCount(1);
  await expect(main).toHaveCSS("max-width", "1180px");
  await expect(main).toHaveCSS("width", "1180px");
  await expect(main).toHaveCSS("padding-left", "40px");
  await expect(main).toHaveCSS("padding-right", "40px");
  await expect(main).toHaveCSS("padding-top", "40px");
  await expect(main).toHaveCSS("padding-bottom", "40px");

  const margins = await main.evaluate((el) => {
    const styles = getComputedStyle(el);
    return { left: parseFloat(styles.marginLeft), right: parseFloat(styles.marginRight) };
  });
  expect(margins.left).toBeGreaterThan(0);
  expect(margins.right).toBe(margins.left);
}

test.describe.serial("Contenedor de página estándar", () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, "dev_direccion");
  });

  test("Norte estratégico usa el contenedor de página estándar", async ({ page }) => {
    await page.goto("/norte-estrategico");
    await expect(
      page.getByRole("heading", { name: "De dónde baja todo lo demás" }),
    ).toBeVisible();
    await expectStandardPageContainer(page);
  });

  test("OKRs usa el contenedor de página estándar", async ({ page }) => {
    await page.goto("/okrs");
    await expect(
      page.getByRole("heading", { name: "Objetivos que bajan a resultados medibles" }),
    ).toBeVisible();
    await expectStandardPageContainer(page);
  });

  test("Dashboard usa el contenedor de página estándar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Panorama de la organización|Tu panorama personal/ }),
    ).toBeVisible();
    await expectStandardPageContainer(page);
  });
});
