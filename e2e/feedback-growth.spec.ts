import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

test("request → private Feedback → public Kudo → GrowthPlan evidence", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  await page.goto("/okrs");
  await page.getByLabel("Título").fill("Crecimiento Feedback E2E");
  await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
  await page.getByRole("button", { name: "Crear objetivo" }).click();
  await page.getByLabel("Nuevo Key Result").fill("Mejorar conversaciones de desarrollo");
  await page.getByLabel("Tipo de medición").selectOption("percentage");
  await page.getByLabel("Valor inicial").fill("0");
  await page.getByLabel("Target").fill("100");
  await page.getByRole("button", { name: "Agregar KR" }).click();
  await expect(page.getByRole("status")).toContainText("Key Result agregado");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo publicado");

  await page.goto("/feedback-y-carrera");
  await expect(
    page.getByRole("heading", { name: "Crecer con señales del trabajo real" }),
  ).toBeVisible();
  const requestForm = page.locator("form", { hasText: "Solicitar Feedback" });
  await requestForm.getByLabel("Pedírselo a").selectOption({ label: "Lider Dev" });
  await requestForm
    .getByLabel("¿Sobre qué necesitás Feedback?")
    .fill("Mi claridad al priorizar");
  await requestForm.getByRole("button", { name: "Solicitar Feedback" }).click();
  await expect(requestForm.getByText("Solicitud enviada.")).toBeVisible();

  await signInAs(page, "dev_lider");
  await page.goto("/feedback-y-carrera");
  const pending = page.locator('[data-slot="card"]', { hasText: "Mi claridad al priorizar" });
  await pending
    .getByLabel("Feedback")
    .fill("Tu foco en el resultado es una fortaleza visible.");
  await pending.getByLabel("Clasificación").selectOption("strength");
  await pending.getByRole("button", { name: "Responder solicitud" }).click();
  await expect(page.getByText("No tenés solicitudes pendientes.")).toBeVisible();

  await signInAs(page, "dev_colaborador");
  await page.goto("/feedback-y-carrera");
  await expect(
    page.getByText("Tu foco en el resultado es una fortaleza visible."),
  ).toBeHidden();

  await signInAs(page, "dev_direccion");
  await page.goto("/feedback-y-carrera");
  await expect(
    page.getByText("Tu foco en el resultado es una fortaleza visible."),
  ).toBeVisible();

  const kudoForm = page.locator("form", { hasText: "Publicar reconocimiento" });
  await kudoForm.getByLabel("Reconocer a").selectOption({ label: "Lider Dev" });
  await kudoForm.getByLabel("Mensaje").fill("Gracias por sostener la coordinación del equipo.");
  await kudoForm.getByLabel("Valor demostrado").selectOption({ label: "Ownership" });
  await kudoForm
    .getByLabel("Objective (opcional)")
    .selectOption({ label: "Crecimiento Feedback E2E" });
  await kudoForm.getByRole("button", { name: "Publicar reconocimiento" }).click();
  await expect(
    page.getByText("Gracias por sostener la coordinación del equipo."),
  ).toBeVisible();
  await expect(page.getByText("Ownership", { exact: false }).last()).toBeVisible();

  const planForm = page.locator("form", { hasText: "Guardar plan" });
  await planForm.getByLabel("Próximo hito").fill("Liderar una iniciativa transversal");
  await planForm.getByLabel("Comunicación").selectOption("3");
  await planForm.getByRole("button", { name: "Guardar plan" }).click();
  await expect(page.getByText("Gap 2")).toBeVisible();
  await expect(page.getByText("Progreso · 33%")).toBeVisible();

  const projectRow = page.locator("form", { hasText: "Proyecto Feedback E2E" });
  await projectRow.getByRole("button", { name: "Cerrar proyecto" }).click();
  const evidenceForm = page.locator("form", { hasText: "Proyecto cerrado" });
  await evidenceForm
    .getByLabel("Proyecto cerrado")
    .selectOption({ label: "Proyecto Feedback E2E" });
  await evidenceForm.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByText("Evidencia: Proyecto Feedback E2E")).toBeVisible();

  // La suite comparte DB: el escenario archiva su OKR para no contaminar tests posteriores.
  await page.goto("/okrs");
  const active = page
    .locator('section[aria-labelledby="active-objectives-title"] [data-slot="card"]')
    .filter({ hasText: "Crecimiento Feedback E2E" })
    .first();
  await active.getByLabel("Calificación final").selectOption("Achieved");
  await active.getByRole("button", { name: "Calificar" }).click();
  await active.getByRole("button", { name: "Cerrar ciclo" }).click();
  const history = page
    .locator('section[aria-labelledby="history-title"] [data-slot="card"]')
    .filter({ hasText: "Crecimiento Feedback E2E" })
    .first();
  await history.getByRole("button", { name: "Archivar objetivo" }).click();
  await expect(history.getByText("Solo lectura")).toBeVisible();
});
