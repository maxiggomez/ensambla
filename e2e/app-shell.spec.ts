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

const PLACEHOLDER_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ["Dashboard", "/dashboard"],
  ["Norte estratégico", "/norte-estrategico"],
  ["OKRs", "/okrs"],
  ["Equipos & Proyectos", "/equipos-y-proyectos"],
  ["Rituales", "/rituales"],
  ["Feedback & Carrera", "/feedback-y-carrera"],
  ["Motor Lean", "/motor-lean"],
  ["Skills & Staffing", "/skills-y-staffing"],
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

  test("cada sección navega a su ruta y las capabilities sin UI muestran placeholder", async ({
    page,
  }) => {
    await signInAs(page, "dev_direccion");

    for (const [label, path] of PLACEHOLDER_ROUTES) {
      await sidebar(page).getByRole("link", { name: label }).click();
      await page.waitForURL(`**${path}`);
      await expect(page.getByTestId("under-construction")).toBeVisible();
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
    }
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

    await expect(sidebar(page).getByRole("link", { name: "Equipos & Proyectos" })).toBeHidden();
    await expect(sidebar(page).getByRole("link", { name: "Skills & Staffing" })).toBeHidden();
    await expect(sidebar(page).getByRole("link", { name: "Miembros" })).toBeHidden();
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
