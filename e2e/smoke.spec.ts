import { test, expect } from "@playwright/test";

test("la página de inicio responde", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
});
