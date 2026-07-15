# Tasks: foundation

> Orden **test-first** (ADR-0006): donde aplica, la tarea de test va antes que la de
> implementación (red → green → refactor). Marcar cada tarea al completarla.

## 1. Scaffolding y tooling

- [x] 1.1 Crear app Next.js (App Router) + TypeScript.
- [x] 1.2 Configurar Tailwind + shadcn/ui con los tokens de `docs/design-system.md`
  (`globals.css` + `tailwind.config`). _Nota: Tailwind v4 — los tokens viven en
  `@theme` dentro de `globals.css`; no hay `tailwind.config.ts`._
- [x] 1.3 Configurar ESLint + Prettier + regla de límites entre módulos.
- [x] 1.4 Configurar Vitest y Playwright (con Postgres efímero para integración).
- [x] 1.5 Configurar CI (GitHub Actions): typecheck → lint → Vitest → Playwright → build.
- [x] 1.6 Crear la estructura de carpetas `src/modules/` y `src/shared/` (ADR-0002).

## 2. Shared kernel

- [x] 2.1 **Test** de `Measurement`: progreso por tipo (Check 0/100, numéricos por fórmula,
  Texto por estado) y validación de valores inválidos por tipo. (rojo)
- [x] 2.2 Implementar `Measurement` (unión discriminada Zod + `progress()`). (verde)
- [x] 2.3 Refactor y documentar el value object.
- [x] 2.4 Branded types de IDs, errores de dominio/aplicación base.

## 3. Datos y tenancy

- [x] 3.1 Modelar en Prisma `organization` y `member` (con `organization_id`).
- [x] 3.2 **Test de aislamiento RLS**: una query sin tenant / con otro tenant no ve datos
  ajenos. (rojo)
- [x] 3.3 Migración con políticas RLS + helper `withTenant(orgId, fn)` que setea
  `app.current_org`. (verde)
- [x] 3.4 Check de CI: toda tabla de tenant tiene política RLS.

## 4. Auth

- [x] 4.1 Integrar Clerk (login) y middleware que resuelve el usuario autenticado.
- [x] 4.2 **Test**: request autenticado deriva el tenant correcto y lo aplica al contexto. (rojo)
- [x] 4.3 Mapear usuario ↔ Member y setear el contexto de tenant por request. (verde)

## 5. Capability `identity-org`

- [x] 5.1 **Test** ORG-1: crear organización → aislada; el creador queda como Dirección. (rojo)
- [x] 5.2 Implementar creación de Organization + owner. (verde)
- [x] 5.3 **Test** ORG-2: invitar miembro por email; no duplica si ya existe (merge). (rojo)
- [x] 5.4 Implementar invitación/gestión de Members. (verde)
- [x] 5.5 **Test** ORG-3: visibilidad/edición según rol (Dirección/Líder/Colaborador). (rojo)
- [x] 5.6 Implementar permisos por rol. (verde)
- [x] 5.7 UI mínima: alta de organización e invitación de miembro (design system).

## 6. Verificación (Definition of Done)

- [x] 6.1 Todos los Scenarios de `identity-org` pasan como tests verdes.
- [x] 6.2 Tests de invariantes 🔒 (tenancy) verdes y no salteables.
- [x] 6.3 e2e Playwright: alta de organización + invitación de miembro.
- [x] 6.4 CI en verde (typecheck, lint de límites, Vitest, Playwright, build).
- [ ] 6.5 Review humano del slice antes de habilitar la paralelización de agentes.

## Follow-ups (post-review, no bloquean foundation)

- [ ] F.1 Vinculación de `clerkUserId` al primer login del invitado (completa el
  "gains access" de ORG-2; hoy el member invitado queda sin identidad de auth).
- [ ] F.2 Unit test de tabla para `direccion-guard` (la integración ya lo cubre).
- [ ] F.3 TOCTOU teóricos: demociones concurrentes de dos Direcciones y doble
  `createOrganization` simultáneo del mismo usuario (sin constraint de DB detrás).
- [ ] F.4 UI: estados de error amigables en formularios, localización `esES` de
  Clerk (`@clerk/localizations`), ocultar form de invitación a no-Dirección.
- [ ] F.5 Value object de nombre de member (hoy puede persistir `""` salteando
  el `required` del form) y deduplicar la resolución de tenant en `/members`.
