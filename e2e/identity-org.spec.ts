import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

import { hasRealClerkKeys } from "./env";

/**
 * e2e del slice identity-org (foundation 6.3): login real con Clerk →
 * alta de organización → invitación de miembro (con merge visible).
 * Requiere keys reales de Clerk (.env.local o secrets de CI); sin ellas se
 * saltea y queda pendiente el DoD 6.3.
 */
test.skip(!hasRealClerkKeys(), "Requiere keys reales de Clerk (ver .env.example)");

async function signIn(page: Page): Promise<void> {
  await setupClerkTestingToken({ page });
  // clerk.signIn necesita ClerkJS cargado en una página de la app.
  await page.goto("/sign-in");
  // La instancia autentica por código de email (no password); los mails
  // +clerk_test se verifican solos con el código de test de Clerk.
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: process.env.E2E_CLERK_USER_EMAIL!,
    },
  });
}

test.describe.serial("alta de organización e invitación de miembro", () => {
  test("un usuario autenticado crea su organización y queda como Dirección", async ({
    page,
  }) => {
    await signIn(page);

    await page.goto("/onboarding");
    // Retry-safe: si un retry llega con la org ya creada, /onboarding
    // redirige a /members y la creación se da por cumplida.
    await page.waitForURL(/\/(onboarding|members)/);
    if (page.url().includes("/onboarding")) {
      await page.getByLabel("Nombre de la organización").fill("Acme E2E");
      await page.getByRole("button", { name: "Crear organización" }).click();
    }

    await page.waitForURL("**/members");
    const row = page.locator("li", { hasText: process.env.E2E_CLERK_USER_EMAIL! });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Dirección");
  });

  test("Dirección invita a un miembro por email y el merge no duplica", async ({ page }) => {
    await signIn(page);
    await page.goto("/members");

    await page.getByLabel("Nombre").fill("Bruno Díaz");
    await page.getByLabel("Email").fill("bruno@acme-e2e.test");
    await page.getByLabel("Rol").selectOption("Lider");
    await page.getByRole("button", { name: "Invitar" }).click();

    const brunoRow = page.locator("li", { hasText: "bruno@acme-e2e.test" });
    await expect(brunoRow).toBeVisible();
    await expect(brunoRow).toContainText("Líder");
    const memberCount = await page.locator("li").count();

    // Re-invitación con el mismo email: la lista no crece (merge ORG-2).
    await page.getByLabel("Nombre").fill("Bruno Otra Vez");
    await page.getByLabel("Email").fill("bruno@acme-e2e.test");
    await page.getByLabel("Rol").selectOption("Colaborador");
    await page.getByRole("button", { name: "Invitar" }).click();

    await expect(page.locator("li", { hasText: "bruno@acme-e2e.test" })).toHaveCount(1);
    await expect(page.locator("li")).toHaveCount(memberCount);
    // El registro existente no se toca (sigue siendo Líder).
    await expect(page.locator("li", { hasText: "bruno@acme-e2e.test" })).toContainText("Líder");
  });
});
