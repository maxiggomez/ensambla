# Change: foundation

## Why

Antes de que los agentes puedan construir capabilities en paralelo, se necesitan
cimientos comunes: el proyecto scaffolding, la identidad y el aislamiento multi-tenant,
el shared kernel (incluido el value object `Measurement`) y la infraestructura de tests
y CI. Todo lo demás depende de esto, así que se construye **primero y en serie**.

Este change entrega el andamiaje técnico + la primera capability con requisitos de
usuario: `identity-org` (Organizations, Members, roles).

## What Changes

- **Scaffolding:** app Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, con la
  estructura de monolito modular (`src/modules/`, `src/shared/`) de ADR-0002.
- **Shared kernel:** value object `Measurement` (ADR-0004), tipos de IDs, manejo de
  errores, y el contexto de tenant por request.
- **Datos y tenancy:** PostgreSQL + Prisma; tablas `organization` y `member`; políticas
  RLS (ADR-0003).
- **Auth:** integración con el proveedor (Clerk) y mapeo sesión → contexto de tenant.
- **Capability `identity-org`:** creación de organización, invitación/gestión de
  miembros y permisos por rol.
- **Calidad:** Vitest + Playwright configurados; regla de lint de límites entre módulos;
  pipeline de CI (typecheck, lint, tests, build).

## Impact

- **Specs afectadas:** agrega `identity-org` (delta ADDED en este change).
- **ADRs aplicados:** 0001 (stack), 0002 (arquitectura), 0003 (tenancy), 0004
  (`Measurement`), 0006 (TDD/testing), 0007 (design system).
- **Habilita:** todas las capabilities siguientes, que dependen del kernel y de la tenancy.
- **Sin datos productivos aún:** greenfield; no hay migración de datos.
