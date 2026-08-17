import { expect, test, type Page } from "@playwright/test";

/**
 * e2e del shell de la app autenticada (change app-shell). Corre contra el
 * config dev-auth (AUTH_MODE=mock + DB efímera sembrada). Navegación/render
 * solamente: no importa `src/shared/db` (el cliente generado es ESM y rompe
 * en CommonJS) ni consulta la DB directamente.
 */
const ALL_SECTIONS = [
  "Dashboard",
  "Norte estratégico",
  "OKRs",
  "Equipos & Proyectos",
  "Rituales",
  "Feedback & Carrera",
  "Clima & eNPS",
  "Motor Lean",
  "Skills & Staffing",
  "Miembros",
] as const;

const LIVE_ROUTES: ReadonlyArray<readonly [string, string, string]> = [
  ["Equipos & Proyectos", "/equipos-y-proyectos", "Trabajo por equipos hacia los objetivos"],
  ["Rituales", "/rituales", "Rituales y blockers"],
  ["Skills & Staffing", "/skills-y-staffing", "Competencias y staffing alineados"],
];

async function signInAs(page: Page, devUserId: string): Promise<void> {
  await page.goto("/sign-in");
  await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  await page.getByTestId(`dev-user-${devUserId}`).click();
  await page.waitForURL("**/members");
}

function sidebar(page: Page) {
  return page.getByRole("navigation", { name: "Secciones del producto" });
}

test.describe.serial("app shell", () => {
  test("las rutas autenticadas renderizan el shell con sidebar y topbar", async ({ page }) => {
    await signInAs(page, "dev_direccion");

    await expect(sidebar(page)).toBeVisible();
    await expect(page.getByTestId("topbar")).toBeVisible();

    for (const label of ALL_SECTIONS) {
      await expect(sidebar(page).getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("Equipos & Proyectos, Rituales y Skills & Staffing muestran sus UIs reales", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    for (const [label, path, heading] of LIVE_ROUTES) {
      await sidebar(page).getByRole("link", { name: label }).click();
      await page.waitForURL(`**${path}`);
      await expect(page.getByTestId("under-construction")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
  });

  test("Norte estratégico muestra la UI real dentro del shell", async ({ page }) => {
    await signInAs(page, "dev_direccion");

    await sidebar(page).getByRole("link", { name: "Norte estratégico" }).click();
    await page.waitForURL("**/norte-estrategico");
    await expect(
      page.getByRole("heading", { name: "De dónde baja todo lo demás" }),
    ).toBeVisible();
    await expect(page.getByText("Visión, misión y valores")).toBeVisible();
  });

  test("Dashboard, OKRs, Feedback & Carrera y Motor Lean muestran sus UIs reales dentro del shell", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    await sidebar(page).getByRole("link", { name: "Dashboard" }).click();
    await page.waitForURL("**/dashboard");
    await expect(
      page.getByRole("heading", { name: "Panorama de la organización" }),
    ).toBeVisible();

    await sidebar(page).getByRole("link", { name: "OKRs" }).click();
    await page.waitForURL("**/okrs");
    await expect(
      page.getByRole("heading", { name: "Objetivos que bajan a resultados medibles" }),
    ).toBeVisible();

    await sidebar(page).getByRole("link", { name: "Feedback & Carrera" }).click();
    await page.waitForURL("**/feedback-y-carrera");
    await expect(
      page.getByRole("heading", { name: "Crecer con señales del trabajo real" }),
    ).toBeVisible();

    await sidebar(page).getByRole("link", { name: "Motor Lean" }).click();
    await page.waitForURL("**/motor-lean");
    await expect(
      page.getByRole("heading", { name: "Convertí supuestos en aprendizajes" }),
    ).toBeVisible();
  });

  test("Clima & eNPS y Miembros mantienen sus páginas live dentro del shell", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    await sidebar(page).getByRole("link", { name: "Clima & eNPS" }).click();
    await page.waitForURL("**/culture-enps");
    await expect(page.getByText("El pulso continuo de la cultura")).toBeVisible();

    await sidebar(page).getByRole("link", { name: "Miembros" }).click();
    await page.waitForURL("**/members");
    await expect(page.locator("li", { hasText: "ceo@ensambla.dev" })).toBeVisible();
  });

  test("Dirección ve todas las secciones", async ({ page }) => {
    await signInAs(page, "dev_direccion");

    await expect(
      sidebar(page).getByRole("link", { name: "Equipos & Proyectos" }),
    ).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Skills & Staffing" })).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Miembros" })).toBeVisible();
  });

  test("Colaborador ve solo las secciones de su alcance", async ({ page }) => {
    await signInAs(page, "dev_colaborador");

    await expect(sidebar(page).getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "OKRs" })).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Clima & eNPS" })).toBeVisible();
    await expect(
      sidebar(page).getByRole("link", { name: "Equipos & Proyectos" }),
    ).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Skills & Staffing" })).toBeVisible();

    await expect(sidebar(page).getByRole("link", { name: "Miembros" })).toBeHidden();
  });

  test("Colaborador lee Equipos y Skills sin controles de gestión", async ({ page }) => {
    await signInAs(page, "dev_colaborador");

    await sidebar(page).getByRole("link", { name: "Equipos & Proyectos" }).click();
    await page.waitForURL("**/equipos-y-proyectos");
    await expect(
      page.getByRole("heading", { name: "Trabajo por equipos hacia los objetivos" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear equipo" })).toHaveCount(0);

    await sidebar(page).getByRole("link", { name: "Skills & Staffing" }).click();
    await page.waitForURL("**/skills-y-staffing");
    await expect(
      page.getByRole("heading", { name: "Competencias y staffing alineados" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Definir skill" })).toHaveCount(0);
  });

  test("el shell muestra la identidad y permite cambiar usuario en modo mock", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    const identity = page.getByTestId("shell-identity");
    await expect(identity.getByText("Ceo Dev")).toBeVisible();
    await expect(identity.getByText("Dirección")).toBeVisible();

    await page.getByRole("link", { name: "Cambiar usuario (dev)" }).click();
    await expect(page.getByText("Usuarios de desarrollo")).toBeVisible();
  });
});
