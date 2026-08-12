import { randomUUID } from "node:crypto";

import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

import { E2E_APP_DATABASE_URL, hasRealClerkKeys } from "./env";

// Nota: `src/shared/db` y `src/shared/tenancy` se importan dinámicamente dentro del
// test (ver más abajo). Importarlos en el tope carga el cliente Prisma generado
// (ESM, usa `import.meta`), lo que rompe la carga del spec bajo Playwright incluso
// cuando el test se saltea. Patrón consistente con el resto de los e2e del repo.

test.skip(!hasRealClerkKeys(), "Requiere keys reales de Clerk (ver .env.example)");

async function signIn(page: Page): Promise<void> {
  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: process.env.E2E_CLERK_USER_EMAIL!,
    },
  });
}

// TODO(culture-enps e2e): reescribir este flujo. Dos bloqueos conocidos:
//   1) Playwright carga los módulos como CommonJS y el cliente Prisma generado es ESM
//      (usa `import.meta`), así que sembrar fixtures con `createPrismaClient`/`withTenant`
//      dentro del proceso de Playwright falla. Sembrar por fuera (script/child-process o
//      un endpoint de test), no importando `src/shared/db` en el spec.
//   2) El paso del form ("Enviar respuesta anónima") es flaky: a veces no aparece tras
//      "Lanzar pulso". Estabilizar la espera/estado antes de interactuar.
// El invariante 🔒 (umbral eNPS + anonimato) queda cubierto por los tests de dominio e
// integración (Vitest) mientras tanto. Ver follow-up.
test("launch → anonymous response → threshold → visible aggregate", async ({ page }) => {
  // Deshabilitado temporalmente hasta el rework (ver TODO arriba): Playwright no puede
  // cargar el cliente Prisma ESM y el paso del form es flaky.
  test.fixme();
  await signIn(page);
  await page.goto("/onboarding");
  await page.waitForURL(/\/(onboarding|dashboard)/);
  if (page.url().includes("/onboarding")) {
    await page.getByLabel("Nombre de la organización").fill("Culture E2E");
    await page.getByRole("button", { name: "Crear organización" }).click();
    await page.waitForURL("**/dashboard");
  }

  await page.goto("/culture-enps");
  await expect(
    page.getByRole("heading", { name: "El pulso continuo de la cultura" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Lanzar pulso/ }).click();
  const responseForm = page.locator("form", { hasText: "Enviar respuesta anónima" }).first();
  await expect(responseForm).toBeVisible();
  const pulseId = await responseForm.locator('input[name="pulseId"]').inputValue();

  // El radio es `sr-only` (oculto) y el <label> visible intercepta el click;
  // `force` marca el radio real sin pelear con el overlay del label.
  await responseForm.getByRole("radio", { name: "10" }).check({ force: true });
  await responseForm.getByLabel("¿Qué influyó más?").selectOption("Recognition");
  await responseForm
    .getByLabel("Comentario opcional")
    .fill("Excelente claridad y reconocimiento");
  await responseForm.getByRole("button", { name: /Enviar respuesta anónima/ }).click();

  const resultCard = page.getByTestId(`pulse-result-${pulseId}`);
  await expect(resultCard).toContainText("Resultados protegidos");
  await expect(resultCard).not.toContainText("Excelente claridad");

  const clerkUserId = await page.evaluate(() => {
    const clerkWindow = window as typeof window & { Clerk: { user: { id: string } } };
    return clerkWindow.Clerk.user.id;
  });
  const { createPrismaClient, withTenant } = await import("../src/shared/db");
  const { resolveTenantForUser } = await import("../src/shared/tenancy");
  const db = createPrismaClient(E2E_APP_DATABASE_URL);
  try {
    const organizationId = await resolveTenantForUser(clerkUserId, db);
    expect(organizationId).not.toBeNull();
    await withTenant(
      organizationId!,
      async (tx) => {
        for (const [index, score] of [9, 8, 0].entries()) {
          const email = `anonymous-fixture-${index}@culture-e2e.test`;
          const member = await tx.member.upsert({
            where: { organizationId_email: { organizationId: organizationId!, email } },
            update: {},
            create: {
              organizationId: organizationId!,
              email,
              name: `Fixture ${index}`,
              role: "Colaborador",
            },
          });
          await tx.pulseParticipation.upsert({
            where: { pulseId_memberId: { pulseId, memberId: member.id } },
            update: { responded: true },
            create: {
              organizationId: organizationId!,
              pulseId,
              memberId: member.id,
              responded: true,
            },
          });
          await tx.pulseResponse.create({
            data: {
              organizationId: organizationId!,
              pulseId,
              measurementType: "Integer",
              startValue: 0,
              targetValue: 10,
              currentValue: score,
              driver: index === 2 ? "Workload" : "GoalClarity",
              comment: index === 2 ? "Hay demasiados frentes" : null,
            },
          });
        }
      },
      db,
    );
  } finally {
    await db.$disconnect();
  }

  await page.reload();
  await expect(page.getByTestId(`pulse-result-${pulseId}`)).toContainText("+25");
  await expect(page.getByTestId(`pulse-result-${pulseId}`)).toContainText("Drivers");

  const individual = await page.request.get(`/api/culture-enps/responses/${randomUUID()}`);
  expect(individual.status()).toBe(404);
});
