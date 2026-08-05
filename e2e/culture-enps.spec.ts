import { randomUUID } from "node:crypto";

import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

import { createPrismaClient, withTenant } from "../src/shared/db";
import { resolveTenantForUser } from "../src/shared/tenancy";

import { E2E_APP_DATABASE_URL, hasRealClerkKeys } from "./env";

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

test("launch → anonymous response → threshold → visible aggregate", async ({ page }) => {
  await signIn(page);
  await page.goto("/onboarding");
  await page.waitForURL(/\/(onboarding|members)/);
  if (page.url().includes("/onboarding")) {
    await page.getByLabel("Nombre de la organización").fill("Culture E2E");
    await page.getByRole("button", { name: "Crear organización" }).click();
    await page.waitForURL("**/members");
  }

  await page.goto("/culture-enps");
  await expect(
    page.getByRole("heading", { name: "El pulso continuo de la cultura" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Lanzar pulso/ }).click();
  const responseForm = page.locator("form", { hasText: "Enviar respuesta anónima" }).first();
  await expect(responseForm).toBeVisible();
  const pulseId = await responseForm.locator('input[name="pulseId"]').inputValue();

  await responseForm.getByRole("radio", { name: "10" }).check();
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
