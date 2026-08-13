import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

async function selectDevUser(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

async function answerPendingPulse(
  page: Page,
  input: { score: number; driver: string; comment?: string },
): Promise<void> {
  await page.goto("/culture-enps");
  const form = page.locator("form", { hasText: "Enviar respuesta anónima" }).first();
  await expect(form).toBeVisible();
  await form
    .getByRole("radio", { name: String(input.score), exact: true })
    .check({ force: true });
  await form.getByLabel("¿Qué influyó más?").selectOption(input.driver);
  if (input.comment) {
    await form.getByLabel("Comentario opcional").fill(input.comment);
  }
  await form.getByRole("button", { name: /Enviar respuesta anónima/ }).click();
  await expect(page.getByText("No tenés pulsos pendientes.")).toBeVisible();
}

test("launch → anonymous responses → protected threshold → visible eNPS", async ({ page }) => {
  await selectDevUser(page, "dev_direccion");
  await page.goto("/culture-enps");
  await expect(
    page.getByRole("heading", { name: "El pulso continuo de la cultura" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Lanzar pulso/ }).click();
  await expect(page.getByRole("status")).toContainText("Pulso lanzado.");

  await answerPendingPulse(page, {
    score: 10,
    driver: "Recognition",
    comment: "Excelente claridad y reconocimiento",
  });

  let resultCard = page.locator('[data-testid^="pulse-result-"]').first();
  await expect(resultCard).toContainText("Resultados protegidos");
  await expect(resultCard).not.toContainText("Participación");
  await expect(resultCard).not.toContainText("Excelente claridad y reconocimiento");

  await selectDevUser(page, "dev_lider");
  await answerPendingPulse(page, { score: 9, driver: "GoalClarity" });

  await selectDevUser(page, "dev_colaborador");
  await answerPendingPulse(page, { score: 8, driver: "Coordination" });

  await selectDevUser(page, "dev_direccion");
  await page.goto("/culture-enps");
  resultCard = page.locator('[data-testid^="pulse-result-"]').first();
  await expect(resultCard).toContainText("Resultados protegidos");
  await expect(resultCard).not.toContainText("Drivers");

  await selectDevUser(page, "dev_colaborador_2");
  await answerPendingPulse(page, {
    score: 0,
    driver: "Workload",
    comment: "Hay demasiados frentes",
  });

  await selectDevUser(page, "dev_direccion");
  await page.goto("/culture-enps");
  resultCard = page.locator('[data-testid^="pulse-result-"]').first();
  await expect(resultCard).toContainText("+25");
  await expect(resultCard).toContainText("100%");
  await expect(resultCard).toContainText("Drivers");
  await expect(resultCard).toContainText("Hay demasiados frentes");
  await expect(resultCard).not.toContainText("responseId");

  const individual = await page.request.get(`/api/culture-enps/responses/${randomUUID()}`);
  expect(individual.status()).toBe(404);
});
