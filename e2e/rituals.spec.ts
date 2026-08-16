import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

async function createTeam(page: Page, name: string): Promise<void> {
  await page.goto("/equipos-y-proyectos");
  const teamForm = page.locator("form", { hasText: "Crear equipo" }).first();
  await teamForm.getByLabel("Nombre del equipo").fill(name);
  await teamForm.getByRole("button", { name: "Crear equipo" }).click();
  await expect(teamForm.getByText("Equipo creado.")).toBeVisible();
}

test("Dirección crea una ceremonia, la evalúa como vencida y la marca realizada", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  const teamName = `E2E Rituales ${Date.now()}`;
  await createTeam(page, teamName);

  await page.goto("/rituales");
  await expect(page.getByRole("heading", { name: "Rituales y blockers" })).toBeVisible();

  const ritualForm = page.locator("form", { hasText: "Crear ceremonia" }).first();
  await ritualForm.getByLabel("Team").selectOption({ label: teamName });
  await ritualForm.getByLabel("Nombre").fill("Weekly Sync");
  await ritualForm.getByLabel("Cadencia").selectOption("Weekly");
  await ritualForm.getByLabel("Fecha de inicio").fill("2026-08-01");
  await ritualForm.getByRole("button", { name: "Crear ceremonia" }).click();
  await expect(ritualForm.getByText("Ceremonia creada.")).toBeVisible();

  const ritualCard = page.locator("section").filter({ hasText: "Weekly Sync" }).last();
  await ritualCard.getByRole("button", { name: "Generar fechas" }).click();
  await expect(ritualCard.getByText("Ocurrencias generadas.")).toBeVisible();
  await ritualCard.getByRole("button", { name: "Evaluar estado" }).click();
  await expect(ritualCard.getByText("Vencida").first()).toBeVisible();

  await ritualCard.getByRole("button", { name: "Marcar realizada" }).first().click();
  await expect(ritualCard.getByText("Realizada").first()).toBeVisible();
});

test("Dirección registra y resuelve un Blocker vinculado a un Objective", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  const teamName = `E2E Rituales ${Date.now()}`;
  await createTeam(page, teamName);

  await page.goto("/okrs");
  const objectiveTitle = `E2E Blocker Obj ${Date.now()}`;
  await page.getByLabel("Título").fill(objectiveTitle);
  await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
  await page.getByRole("button", { name: "Crear objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo creado");
  const objectiveCard = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(objectiveTitle, { exact: true }) })
    .last();
  await objectiveCard.getByLabel("Nuevo Key Result").fill("E2E KR Blocker");
  await objectiveCard.getByLabel("Tipo de medición").selectOption("percentage");
  await objectiveCard.getByLabel("Valor inicial").fill("0");
  await objectiveCard.getByLabel("Target").fill("100");
  await objectiveCard.getByRole("button", { name: "Agregar KR" }).click();
  await objectiveCard.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo publicado");

  await page.goto("/rituales");
  const blockerForm = page.locator("form", { hasText: "Registrar Blocker" }).first();
  await blockerForm.getByLabel("Team").selectOption({ label: teamName });
  await blockerForm.getByLabel("Título").fill("Sin acceso a producción");
  await blockerForm.getByLabel("Objective").selectOption({ label: objectiveTitle });
  await blockerForm.getByRole("button", { name: "Registrar Blocker" }).click();
  await expect(blockerForm.getByText("Bloqueo registrado.")).toBeVisible();

  const board = page.locator("section", { hasText: "Tablero de bloqueos" });
  await expect(board.getByText("Sin acceso a producción")).toBeVisible();
  await expect(board.locator("li").filter({ hasText: objectiveTitle })).toBeVisible();

  await board.getByRole("button", { name: "Resolver" }).click();
  await expect(board.getByText("Sin acceso a producción")).toHaveCount(0);
  await expect(page.getByText("Resueltos: 1")).toBeVisible();

  await page.goto("/okrs");
  await page.getByLabel("Calificación final").selectOption("Partial");
  await page.getByRole("button", { name: "Calificar" }).click();
  await expect(page.getByRole("status")).toContainText("Key Result calificado");
  await page.getByRole("button", { name: "Cerrar ciclo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo cerrado");
  const history = page.locator("section", { hasText: "Historial archivado" });
  await expect(history.getByText(objectiveTitle)).toBeVisible();
  await history.getByRole("button", { name: "Archivar objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo archivado");
});

test("el flag de riesgo de aprendizaje aparece y se limpia con una retrospectiva", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  const teamName = `E2E Rituales ${Date.now()}`;
  await createTeam(page, teamName);

  await page.goto("/rituales");
  const riskSection = page.locator("section", { hasText: "Riesgo de aprendizaje" });
  await expect(riskSection.locator("li").filter({ hasText: teamName })).toBeVisible();
  await expect(riskSection.getByText("Riesgo de aprendizaje").first()).toBeVisible();

  const retroForm = page.locator("form", { hasText: "Registrar retrospectiva" }).first();
  await retroForm.getByLabel("Team").selectOption({ label: teamName });
  await retroForm.getByRole("button", { name: "Registrar retrospectiva" }).click();
  await expect(retroForm.getByText("Retrospectiva registrada.")).toBeVisible();

  await page.goto("/rituales");
  await expect(
    page
      .locator("section", { hasText: "Riesgo de aprendizaje" })
      .locator("li")
      .filter({ hasText: teamName }),
  ).toHaveCount(0);
});
