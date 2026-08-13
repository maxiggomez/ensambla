import { expect, test, type Page } from "@playwright/test";

async function signInAsDirection(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId("dev-user-dev_direccion").click();
  await page.waitForURL("**/members");
}

test("hypothesis → building → measuring → structured learning library", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAsDirection(page);

  await page.goto("/okrs");
  await page.getByLabel("Título").fill("Activación Lean E2E");
  await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
  await page.getByRole("button", { name: "Crear objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo creado");
  await page.getByLabel("Nuevo Key Result").fill("Usuarios activados Lean E2E");
  await page.getByLabel("Tipo de medición").selectOption("percentage");
  await page.getByLabel("Valor inicial").fill("10");
  await page.getByLabel("Target").fill("40");
  await page.getByRole("button", { name: "Agregar KR" }).click();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo publicado");

  await page.goto("/motor-lean");
  await expect(
    page.getByRole("heading", { name: "Convertí supuestos en aprendizajes" }),
  ).toBeVisible();
  await page
    .getByLabel("KeyResult")
    .selectOption({ label: "Activación Lean E2E · Usuarios activados Lean E2E" });
  await page.getByLabel("Creemos que").fill("una guía contextual reduce fricción");
  await page.getByLabel("Esperamos").fill("más usuarios activados");
  await page.getByRole("button", { name: "Crear hipótesis" }).click();
  await expect(page.getByText(/We believe una guía contextual reduce fricción/)).toBeVisible();

  let card = page.locator('[data-testid^="experiment-"]', { hasText: "una guía contextual" });
  await card.getByRole("button", { name: "Empezar a construir" }).click();
  card = page.locator('[data-testid^="experiment-"]', { hasText: "una guía contextual" });
  await expect(card.getByLabel("Tipo de métrica")).toBeVisible();
  await card.getByLabel("Tipo de métrica").selectOption("percentage");
  await card.getByLabel("Inicial").fill("10");
  await card.getByLabel("Meta").fill("40");
  await card.getByLabel("Actual").fill("25");
  await card.getByLabel("Fecha de corte").fill("2026-09-30");
  await card.getByRole("button", { name: "Empezar a medir" }).click();

  card = page.locator('[data-testid^="experiment-"]', { hasText: "una guía contextual" });
  await card.getByLabel("Creíamos").fill("los usuarios necesitaban guía");
  await card.getByLabel("Probamos").fill("un recorrido contextual");
  await card.getByLabel("Aprendimos").fill("la activación aumentó");
  await card.getByLabel("Decisión").selectOption("persevere");
  await card.getByRole("button", { name: "Cerrar experimento" }).click();

  const library = page.locator("section", { hasText: "Biblioteca de aprendizajes" });
  await expect(library.getByText("los usuarios necesitaban guía")).toBeVisible();
  await expect(library.getByText("Usuarios activados Lean E2E")).toBeVisible();
  await expect(library.getByText("Activación Lean E2E")).toBeVisible();
  await expect(library.getByText("Perseverar")).toBeVisible();

  // El spec comparte la DB efímera con el resto de la suite: archiva su OKR
  // para no dejar una señal activa que altere strategy/okrs posteriores.
  await page.goto("/okrs");
  const activeObjectives = page.locator('section[aria-labelledby="active-objectives-title"]');
  let objectiveCard = activeObjectives
    .locator('[data-slot="card"]', { hasText: "Activación Lean E2E" })
    .first();
  await objectiveCard.getByLabel("Calificación final").selectOption("Achieved");
  await objectiveCard.getByRole("button", { name: "Calificar" }).click();
  objectiveCard = activeObjectives
    .locator('[data-slot="card"]', { hasText: "Activación Lean E2E" })
    .first();
  await objectiveCard.getByRole("button", { name: "Cerrar ciclo" }).click();
  const historyCard = page
    .locator('section[aria-labelledby="history-title"] [data-slot="card"]')
    .filter({ hasText: "Activación Lean E2E" })
    .first();
  await historyCard.getByRole("button", { name: "Archivar objetivo" }).click();
  await expect(historyCard.getByText("Solo lectura")).toBeVisible();
});
