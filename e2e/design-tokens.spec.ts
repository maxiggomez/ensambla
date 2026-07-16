import { expect, test } from "@playwright/test";

/**
 * Identidad visual Radar (change design-system-radar): los tokens y la
 * tipografía deben llegar efectivamente al render, no solo estar declarados.
 * Corre sobre la home pública: no necesita Clerk ni base de datos.
 */

const PAPER = "rgb(247, 249, 246)"; // #f7f9f6
const INK = "rgb(24, 35, 29)"; // #18231d
const LIME = "rgb(202, 255, 71)"; // #caff47

test("los tokens Radar se aplican a la página renderizada", async ({ page }) => {
  await page.goto("/");

  const body = page.locator("body");
  await expect(body).toHaveCSS("background-color", PAPER);
  await expect(body).toHaveCSS("color", INK);

  const cta = page.getByTestId("cta-primary");
  await expect(cta).toBeVisible();
  await expect(cta).toHaveCSS("background-color", LIME);
});

test("la tipografía del body es Inter", async ({ page }) => {
  await page.goto("/");
  const fontFamily = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(fontFamily.split(",")[0].replaceAll('"', "").trim()).toBe("Inter");
});
