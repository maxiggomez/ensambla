import { expect, test, type Page } from "@playwright/test";

const TEAM_NAME = "E2E Equipo Comercial";
const PROJECT_NAME = "E2E Proyecto Ventas";
const OBJECTIVE_TITLE = "E2E Objetivo Vinculado";

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

test("Dirección administra equipos, miembros y proyectos", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  await page.goto("/equipos-y-proyectos");
  await expect(
    page.getByRole("heading", { name: "Trabajo por equipos hacia los objetivos" }),
  ).toBeVisible();

  const teamForm = page.locator("form", { hasText: "Crear equipo" });
  await teamForm.getByLabel("Nombre del equipo").fill(TEAM_NAME);
  await teamForm.getByLabel("Descripción").fill("Ventas y cuentas clave");
  await teamForm.getByRole("button", { name: "Crear equipo" }).click();
  await expect(page.getByText("Equipo creado.")).toBeVisible();

  const teamCard = page.getByTestId(`team-card-${TEAM_NAME}`);
  const assignForm = teamCard.locator("form", { hasText: "Asignar miembro" });
  await assignForm.getByLabel("Persona").selectOption({ label: "Colaborador Dev" });
  await assignForm.getByLabel("Rol").selectOption({ label: "Contributor" });
  await assignForm.getByLabel("% de carga").fill("50");
  await assignForm.getByRole("button", { name: "Asignar" }).click();
  await expect(assignForm.getByText("Miembro asignado.")).toBeVisible();
  const memberRow = teamCard.locator("li", { hasText: "Colaborador Dev" });
  await expect(memberRow).toContainText("Contributor");
  await expect(memberRow).toContainText("50%");
  await expect(teamCard.getByText(/Capacidad del equipo · 50%/)).toBeVisible();

  const projectForm = page.locator("form", { hasText: "Crear proyecto" });
  await projectForm.getByLabel("Nombre del proyecto").fill(PROJECT_NAME);
  await projectForm.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(projectForm.getByText("Proyecto creado.")).toBeVisible();

  await page.goto("/okrs");
  await page.getByLabel("Título").fill(OBJECTIVE_TITLE);
  await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
  await page.getByRole("button", { name: "Crear objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo creado");

  await page.goto("/equipos-y-proyectos");
  const projectCard = page.getByTestId(`project-card-${PROJECT_NAME}`);
  await projectCard.getByLabel("Vincular a un objetivo").selectOption(OBJECTIVE_TITLE);
  await projectCard.getByRole("button", { name: "Vincular" }).click();
  await expect(projectCard.getByText("Objetivo vinculado.")).toBeVisible();

  await projectCard.getByRole("button", { name: "Cerrar proyecto" }).click();
  await expect(projectCard.getByText("Cerrado")).toBeVisible();
  await expect(projectCard.getByRole("button", { name: "Cerrar proyecto" })).toHaveCount(0);
});

test("las alertas de alineamiento se muestran", async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, "dev_direccion");

  await page.goto("/equipos-y-proyectos");
  const projectForm = page.locator("form", { hasText: "Crear proyecto" });
  await projectForm.getByLabel("Nombre del proyecto").fill("E2E Proyecto Aislado");
  await projectForm.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(projectForm.getByText("Proyecto creado.")).toBeVisible();

  await page.goto("/okrs");
  await page.getByLabel("Título").fill("E2E KR Sin Proyecto");
  await page.getByLabel("Nivel", { exact: true }).selectOption("Company");
  await page.getByRole("button", { name: "Crear objetivo" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo creado");
  const objectiveCard = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("E2E KR Sin Proyecto", { exact: true }) })
    .last();
  await objectiveCard.getByLabel("Nuevo Key Result").fill("Conversión E2E");
  await objectiveCard.getByLabel("Tipo de medición").selectOption("percentage");
  await objectiveCard.getByLabel("Valor inicial").fill("0");
  await objectiveCard.getByLabel("Target").fill("100");
  await objectiveCard.getByRole("button", { name: "Agregar KR" }).click();
  await objectiveCard.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Objetivo publicado");

  await page.goto("/equipos-y-proyectos");
  const alerts = page.locator("section", { hasText: "Alertas de alineamiento" });
  await expect(alerts.getByText("E2E Proyecto Aislado", { exact: false })).toBeVisible();
  await expect(alerts.getByText("E2E KR Sin Proyecto ·", { exact: false })).toBeVisible();
});

test("Colaborador ve equipos y proyectos en sólo lectura", async ({ page }) => {
  await signInAs(page, "dev_colaborador");

  await page.goto("/equipos-y-proyectos");
  await expect(
    page.getByRole("heading", { name: "Trabajo por equipos hacia los objetivos" }),
  ).toBeVisible();
  await expect(page.getByText("E2E Equipo Comercial")).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear equipo" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Crear proyecto" })).toHaveCount(0);
  await expect(page.getByText("Asignar miembro", { exact: false })).toHaveCount(0);
});
