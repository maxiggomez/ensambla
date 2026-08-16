import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

test("Dirección define skills, registra competencias y seniority", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  await page.goto("/skills-y-staffing");
  await expect(
    page.getByRole("heading", { name: "Competencias y staffing alineados" }),
  ).toBeVisible();

  const skillForm = page.locator("form", { hasText: "Definir skill" });
  await skillForm.getByLabel("Nombre de la skill").fill("E2E Negociación");
  await skillForm.getByRole("button", { name: "Definir skill" }).click();
  await expect(skillForm.getByText("Skill creada.")).toBeVisible();

  const matrix = page.locator("section", { hasText: "Matriz de competencias" });
  const row = matrix.locator("tr", { hasText: "Ceo Dev" });
  await row.getByLabel(/Nivel E2E Negociación/).selectOption("3");
  await expect(row.getByLabel(/Nivel E2E Negociación/)).toHaveValue("3");

  const seniorityForm = page.locator("form", { hasText: "Seniority" });
  await seniorityForm.getByLabel("Persona").selectOption({ label: "Lider Dev" });
  await seniorityForm.getByLabel("Seniority").selectOption("Senior");
  await seniorityForm.getByRole("button", { name: "Guardar seniority" }).click();
  await expect(seniorityForm.getByText("Seniority guardada.")).toBeVisible();
});

test("Líder registra competencias pero no ve el control de seniority", async ({ page }) => {
  await signInAs(page, "dev_lider");

  await page.goto("/skills-y-staffing");
  const matrix = page.locator("section", { hasText: "Matriz de competencias" });
  await expect(matrix).toBeVisible();
  await expect(page.locator("form", { hasText: "Seniority" })).toHaveCount(0);
  const row = matrix.locator("tr", { hasText: "Ceo Dev" });
  await row.getByLabel(/Nivel/).first().selectOption("2");
  await expect(row.getByLabel(/Nivel/).first()).toHaveValue("2");
});

test("Colaborador ve la matriz en sólo lectura", async ({ page }) => {
  await signInAs(page, "dev_colaborador");

  await page.goto("/skills-y-staffing");
  const matrix = page.locator("section", { hasText: "Matriz de competencias" });
  await expect(matrix).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Comunicación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Definir skill" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guardar seniority" })).toHaveCount(0);
});

test("sugerencias de staffing para una necesidad", async ({ page }) => {
  await signInAs(page, "dev_direccion");

  await page.goto("/skills-y-staffing");
  const needForm = page.locator("form", { hasText: "Necesidad de staffing" });
  await needForm.getByLabel("Necesidad").selectOption({
    label: "Project · Proyecto Feedback E2E",
  });
  await needForm.getByRole("button", { name: "Ver sugerencias" }).click();
  const suggestions = page.locator("section", { hasText: "Sugerencias de staffing" });
  await expect(suggestions).toBeVisible();
  await expect(suggestions.getByText(/para un Project/i)).toBeVisible();
});

test("gaps: registrar requisito y ver el riesgo bus factor", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  await page.goto("/skills-y-staffing");
  const matrix = page.locator("section", { hasText: "Matriz de competencias" });
  const ceoRow = matrix.locator("tr", { hasText: "Ceo Dev" });
  await ceoRow.getByLabel(/Nivel Comunicación/).selectOption("3");
  await expect(ceoRow.getByLabel(/Nivel Comunicación/)).toHaveValue("3");

  await page.goto("/okrs");
  await page.getByLabel("Título").fill("E2E Gap Bus");
  await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
  await page.getByRole("button", { name: "Crear objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo creado");
  const objectiveCard = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("E2E Gap Bus", { exact: true }) })
    .last();
  await objectiveCard.getByLabel("Nuevo Key Result").fill("E2E KR Gap");
  await objectiveCard.getByLabel("Tipo de medición").selectOption("percentage");
  await objectiveCard.getByLabel("Valor inicial").fill("0");
  await objectiveCard.getByLabel("Target").fill("100");
  await objectiveCard.getByRole("button", { name: "Agregar KR" }).click();
  await objectiveCard.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo publicado");

  await page.goto("/skills-y-staffing");
  const needForm = page.locator("form", { hasText: "Necesidad de staffing" });
  await needForm.getByLabel("Necesidad").selectOption({
    label: "KeyResult · E2E Gap Bus · E2E KR Gap",
  });
  await needForm.getByRole("button", { name: "Ver sugerencias" }).click();
  const requirementForm = page.locator("form", { hasText: "Registrar skill requerido" });
  await requirementForm.getByLabel("Skill").selectOption({ label: "Comunicación" });
  await requirementForm.getByRole("button", { name: "Registrar requisito" }).click();
  await expect(requirementForm.getByText("Requisito agregado.")).toBeVisible();

  const gaps = page.locator("section", { hasText: "Gaps de cobertura" });
  await expect(gaps.getByText("Riesgo bus factor")).toBeVisible();
  await expect(gaps.getByText("Comunicación")).toBeVisible();

  await page.goto("/okrs");
  await page.getByLabel("Calificación final").selectOption("Partial");
  await page.getByRole("button", { name: "Calificar" }).click();
  await expect(page.getByRole("status")).toContainText("Key Result calificado");
  await page.getByRole("button", { name: "Cerrar ciclo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo cerrado");
  const history = page.locator("section", { hasText: "Historial archivado" });
  await expect(history.getByText("E2E Gap Bus")).toBeVisible();
  await history.getByRole("button", { name: "Archivar objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo archivado");
});
