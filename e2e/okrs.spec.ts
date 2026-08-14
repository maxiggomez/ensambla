import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

test.describe.serial("OKR full-cycle workspace", () => {
  test("Dirección crea, publica, registra riesgo, cierra y archiva un OKR", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await signInAs(page, "dev_direccion");
    await page.goto("/okrs");
    await expect(
      page.getByRole("heading", { name: "Objetivos que bajan a resultados medibles" }),
    ).toBeVisible();

    await page.getByLabel("Nombre del ciclo").fill("Q4 E2E");
    await page.getByLabel("Inicio").fill("2026-10-01");
    await page.getByLabel("Fin", { exact: true }).fill("2026-12-31");
    await page.getByRole("button", { name: "Crear ciclo" }).click();
    await expect(page.getByRole("status")).toContainText("Ciclo creado");

    await page.getByLabel("Título").fill("Expandir E2E");
    await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
    await page.getByLabel("Ciclo", { exact: true }).selectOption({ label: "Q4 E2E" });
    await page.getByRole("button", { name: "Crear objetivo" }).click();
    await expect(page.getByRole("status")).toContainText("Objetivo creado");

    await page.getByLabel("Nuevo Key Result").fill("Clientes E2E");
    await page.getByLabel("Tipo de medición").selectOption("integer");
    await page.getByLabel("Valor inicial").fill("0");
    await page.getByLabel("Target").fill("10");
    await page.getByRole("button", { name: "Agregar KR" }).click();
    await expect(page.getByRole("status")).toContainText("Key Result agregado");

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status")).toContainText("Objetivo publicado");

    await page.getByLabel("Valor del check-in").fill("4");
    await page.getByLabel("Confianza (0–10)").fill("4");
    await page.getByLabel("Comentario").fill("Riesgo detectado en E2E");
    await page.getByLabel("Evidencia (link HTTPS)").fill("https://example.com/e2e");
    await page.getByLabel("Evidencia (archivo, máx. 5 MiB)").setInputFiles({
      name: "evidencia.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("evidencia e2e"),
    });
    await page.getByRole("button", { name: "Registrar check-in" }).click();
    await expect(page.getByRole("status")).toContainText("Check-in registrado");
    await expect(page.getByText("En riesgo", { exact: true })).toBeVisible();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Riesgos de desalineamiento" }),
    ).toBeVisible();
    await expect(page.getByText("Clientes E2E")).toBeVisible();

    await page.goto("/okrs");
    await page.getByLabel("Calificación final").selectOption("Partial");
    await page.getByRole("button", { name: "Calificar" }).click();
    await expect(page.getByRole("status")).toContainText("Key Result calificado");
    await page.getByRole("button", { name: "Cerrar ciclo" }).click();
    await expect(page.getByRole("status")).toContainText("Objetivo cerrado");

    const history = page.locator("section", { hasText: "Historial archivado" });
    await expect(history.getByText("Expandir E2E")).toBeVisible();
    await history.getByRole("button", { name: "Archivar objetivo" }).click();
    await expect(page.getByRole("status")).toContainText("Objetivo archivado");
    await expect(
      history
        .locator('[data-slot="card"]', { hasText: "Expandir E2E" })
        .getByText(/Solo lectura/),
    ).toBeVisible();
  });

  test("Colaborador recibe feedback al intentar crear un Objective de compañía", async ({
    page,
  }) => {
    await signInAs(page, "dev_colaborador");
    await page.goto("/okrs");
    await page.getByLabel("Título").fill("No autorizado E2E");
    await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
    await page.getByRole("button", { name: "Crear objetivo" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "No tenés permiso" })).toBeVisible();
  });
});
