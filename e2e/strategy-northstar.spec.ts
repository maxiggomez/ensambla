import { expect, test, type Page } from "@playwright/test";

/**
 * e2e del slice strategy-northstar (mock auth). Corre contra `next dev` con
 * `AUTH_MODE=mock` y la DB efímera sembrada con "Ensambla Dev" y los users
 * dev. Un solo test serial (sin estado compartido entre tests): Dirección
 * define la estrategia completa y ve la cascada; después cambia a Líder y
 * verifica que lee sin formularios de edición. El login mock aterriza en
 * `/members` (landing actual de main).
 */
async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

async function switchUser(page: Page, devUserId: string): Promise<void> {
  await page.goto("/members");
  await page.getByRole("link", { name: "Cambiar usuario (dev)" }).click();
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

const strategyForm = (page: Page) => page.locator("form", { hasText: "Visión" });
const northStarForm = (page: Page) =>
  page.locator("form", { hasText: "Nombre de la North Star" });
const leverForm = (page: Page) => page.locator("form", { hasText: "Nombre del lever" });
const pillarForm = (page: Page) => page.locator("form", { hasText: "Nombre del pilar" });

test("Dirección define la estrategia y la cascada; Líder lee sin formularios de edición", async ({
  page,
}) => {
  await signInAs(page, "dev_direccion");
  await page.goto("/norte-estrategico");
  await expect(
    page.getByRole("heading", { name: "De dónde baja todo lo demás" }),
  ).toBeVisible();

  // Scenario Define strategy statements
  await page.getByLabel("Visión").fill("Ser la referencia de gestión ágil");
  await page.getByLabel("Misión").fill("Alinear equipos con el rumbo");
  await page.getByLabel("Valores").fill("Claridad\nAutonomía");
  await page.getByRole("button", { name: "Guardar estrategia" }).click();
  await expect(strategyForm(page).getByRole("status")).toContainText("Estrategia guardada.");
  await expect(page.getByText("Claridad", { exact: true })).toBeVisible();

  // North Star tipada (Measurement percentage)
  await page.getByLabel("Nombre de la North Star").fill("ARR");
  await page.getByLabel("Tipo de medición").selectOption("percentage");
  const ns = northStarForm(page);
  await ns.getByLabel("Base").fill("0");
  await ns.getByLabel("Objetivo").fill("100");
  await ns.getByLabel("Actual").fill("42");
  await page.getByRole("button", { name: "Definir North Star" }).click();
  await expect(page.getByText("42%", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Definir North Star" })).toBeHidden();

  // Scenario Link an input lever to an objective (sin objetivo en este seed)
  await page.getByLabel("Nombre del lever").fill("Leads calificados");
  await page.getByRole("button", { name: "Agregar lever" }).click();
  await expect(leverForm(page).getByRole("status")).toContainText("Lever agregado.");
  await expect(page.getByText("Leads calificados").first()).toBeVisible();

  // Scenario Group objectives under a pillar + cascada visible
  await page.getByLabel("Nombre del pilar").fill("Crecimiento");
  await page.getByRole("button", { name: "Crear pilar" }).click();
  await expect(pillarForm(page).getByRole("status")).toContainText("Pilar creado.");
  await expect(page.getByText("Sin objetivos visibles.").first()).toBeVisible();
  await expect(page.getByText("Sin pilar", { exact: true })).toBeHidden();
  await expect(page.getByText(/Definí la North Star/)).toBeHidden();

  // Líder lee la estrategia y el mapa sin formularios de edición
  await switchUser(page, "dev_lider");
  await page.goto("/norte-estrategico");
  await expect(page.getByText("Ser la referencia de gestión ágil").first()).toBeVisible();
  await expect(page.getByText("ARR", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("42%", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Leads calificados").first()).toBeVisible();
  await expect(page.getByText("Sin objetivos visibles.").first()).toBeVisible();

  await expect(page.getByRole("button", { name: "Guardar estrategia" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Definir North Star" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Agregar lever" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Crear pilar" })).toBeHidden();
});
