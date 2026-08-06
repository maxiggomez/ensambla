# Proposal: dev-auth-mock

## Why

El desarrollo local depende de Clerk para autenticar, y el flujo real de
login (OAuth de Google) falla en sesiones de incógnito y agrega fricción
(tener que crear usuarios en el dashboard). Para trabajar features de
cualquier capability se necesita poder autenticarse localmente de forma
determinista, eligiendo entre usuarios preseteados, sin depender de Clerk.

## What Changes

- **Gateway de auth (`src/lib/auth/`)**: seam sobre el contrato que la app ya
  consume (`auth()` → `{ userId }`, `currentUser()` → shape `User`, provider
  y sign-in). Dos implementaciones: `clerk` (la de hoy, intacta) y `mock`
  (dev). La resolución es por flag explícito `AUTH_MODE=mock` **y** gate duro
  de `NODE_ENV === 'development'`; en producción el mock no es compilable ni
  alcanzable (el route de dev 404).
- **Usuarios preseteados (fijos en código) + seed**: 3 identidades dev con
  ids sintéticos `dev_*`, emails verificados y roles Dirección / Líder /
  Colaborador. El seed crea la Organization y sus Members con esos
  `clerk_user_id` para que el flujo mock → tenancy (RLS por `app.current_user`)
  funcione idéntico al de un usuario real.
- **Picker en `/sign-in` (modo mock)**: lista los usuarios dev; elegir uno
  establece la sesión vía cookie first-party `httpOnly` (`ensambla_dev_user`).
  Incluye **cambiar de usuario** y **salir** (hoy no existe logout).
- **Contrato fiel al uso actual**: el mock devuelve exactamente lo que lee el
  sistema hoy — `id` opaco, `primaryEmailAddress`, `emailAddresses[]` con
  `verification.status = 'verified'` y `fullName`. `verifiedEmail()` y la
  vinculación por email (F.1) funcionan sin cambios.

## Capabilities

### MODIFIED: `identity-org`

En desarrollo local con `AUTH_MODE=mock`, el sistema SHALL autenticar sin
Clerk eligiendo entre usuarios preseteados, con el mismo contrato de datos.

## Non-goals

- No reemplazar Clerk en producción/test/CI (sigue intacto).
- No tocar RLS ni invariantes de tenancy (el mock usa el mismo string id).
- No agregar OAuth ni proveedores nuevos.

## Impact

- `src/lib/auth/` (nuevo), `src/proxy.ts`, `src/app` (layout, sign-in,
  call sites), `scripts/seed-dev.ts` (nuevo), `.env.example`,
  tests unit/integration/e2e.
