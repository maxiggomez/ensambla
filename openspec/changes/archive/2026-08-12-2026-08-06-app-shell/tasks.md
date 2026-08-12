# Tasks: app-shell

Orden test-first (ADR-0006). Cada tarea de test precede a su implementación y
declara el Scenario cubierto. No se marca ninguna tarea hasta observar rojo →
verde y no se hace commit sin aprobación explícita.

## 1. Registro de secciones y filtro por rol (🔒)

- [x] 1.1 **Test rojo** `src/app/(app)/sections.test.ts` — `sectionsForRole`:
      Dirección ve las 10 secciones; Líder/Colaborador ven todas excepto
      "Miembros" (management). Cubre los Scenarios **Dirección sees all
      sections** y **Colaborador sees only their scope**
- [x] 1.2 Implementar `src/app/(app)/sections.ts` (registro + `sectionsForRole`
      usando `canManageMembers` de `identity-org`). Los íconos se resuelven en
      el cliente por `slug` (no se serializan componentes server→client);
      `navigation.ts` se descartó: el shell renderiza el nav con los `SECTIONS`.

## 2. Shell layout

- [x] 2.1 **Test rojo/e2e** `e2e/app-shell.spec.ts` — `/dashboard` renderiza el
      shell con sidebar y topbar; guard de auth redirect a `/sign-in`; sin
      miembro redirect a `/onboarding`. (Scenario **Logging in lands on the app
      home**)
- [x] 2.2 `src/app/(app)/layout.tsx` + shell (sidebar `deep` 248px, topbar 64px)
      en `app-shell.tsx` (cliente), con los tokens del design system
- [x] 2.3 Mudar `members`, `strategy-northstar`, `culture-enps` bajo
      `src/app/(app)/` (URL sin cambio) y ajustar imports relativos

## 3. Placeholders y navegación

- [x] 3.1 **Test** e2e (app-shell.spec): cada sección del sidebar navega a su
      ruta y las capabilities sin UI muestran "En construcción". (rojo)
- [x] 3.2 Rutas placeholder para Dashboard, OKRs, Equipos & Proyectos, Rituales,
      Feedback & Carrera, Motor Lean, Skills & Staffing + componente
      `UnderConstruction` (Clima & eNPS ya tiene UI propia)

## 4. Identidad en el shell

- [x] 4.1 Avatar + nombre + rol del usuario en el shell; en modo mock acceso a
      "Cambiar usuario (dev)" (test-alongside, UI)

## 5. Landing post-login

- [x] 5.1 **Test** e2e (app-shell.spec): el mock picker aterriza en `/dashboard`.
      (rojo)
- [x] 5.2 Actualizar `selectDevUserAction` → `/dashboard`, CTAs de la home y
      redirects de onboarding: "Ir a mi organización" → `/dashboard`
- [x] 5.3 Ajustar `e2e/dev-auth.spec.ts` al nuevo landing + excluir los specs
      mock-only del config de Clerk (`playwright.config.ts`)

## 6. Verificación

- [x] 6.1 `npm run typecheck` · `npm run lint` · `npm run format:check` ·
      `npm run test` · `npm run test:e2e` · `npm run test:e2e:dev-auth` ·
      `npm run build` · `openspec validate --all --strict`