# Tasks: dev-auth-mock

> Orden test-first (ADR-0006).

## 1. Registro de usuarios mock (dominio del gateway)

- [x] 1.1 **Test** unit `src/lib/auth/mock-users.test.ts`: el registro fijo
  expone 3 usuarios con id `dev_*`, email verificado y rol; el shape cumple el
  contrato de `verifiedEmail` (primary verificado). (rojo)
- [x] 1.2 `mock-users.ts`: lista fija de usuarios dev (ceo/lider/colaborador
  @ensambla.dev) con ids sintéticos y emails `verified`. (verde)

## 2. Resolución de modo (gate 🔒)

- [x] 2.1 **Test** unit `gateway.test.ts`: con `AUTH_MODE=mock` +
  `NODE_ENV=development` → modo mock; con `NODE_ENV=production` → nunca mock
  (aunque la flag esté); sin flag → clerk. (rojo)
- [x] 2.2 `gateway.ts`: `resolveAuthMode(env)` y selección de impl
  clerk/mock. (verde)

## 3. Sesión mock por cookie (cambiar/salir)

- [x] 3.1 **Test** unit `session.test.ts`: set/get/clear de la cookie
  `ensambla_dev_user` (httpOnly); cambiar usuario reemplaza la sesión;
  salir la limpia. (rojo)
- [x] 3.2 `session.ts`: helpers de cookie (server). (verde)

## 4. Contrato del gateway (auth/currentUser)

- [x] 4.1 **Test** unit: `getCurrentUser()` mock devuelve el shape que
  consume `verifiedEmail` (primary verificado); `auth()` devuelve `{ userId }`
  opaco; sin sesión → null. (rojo)
- [x] 4.2 `index.ts` + call sites (`page.tsx`, `members/page.tsx`,
  `members/actions.ts`, `onboarding/page.tsx`, `onboarding/actions.ts`) pasan
  a usar el gateway. (verde)

## 5. Picker y provider en la UI (test-alongside)

- [x] 5.1 `sign-in` en modo mock: lista preseteados, elegir setea sesión;
  en modo clerk sigue el `SignIn` de Clerk. Provider condicional en layout.
  `proxy.ts` condicional (mock: sin `clerkMiddleware`).
- [x] 5.2 **Test** e2e `e2e/dev-auth.spec.ts`: picker → login → /members;
  cambiar usuario; salir. (test-alongside, UI)

## 6. Seed de datos dev

- [x] 6.1 **Test** integración `test/integration/dev-auth-mock.test.ts`: con
  la DB sembrada (org + 3 members `dev_*`), un `getCurrentUser()` mock con
  email verificado resuelve su tenant y rol (RLS idéntico). (rojo)
- [x] 6.2 `scripts/seed-dev.ts`: crea la Organization y los Members con
  `clerk_user_id = dev_*`. (verde)

## 7. Config y verificación

- [x] 7.1 `.env.example`: documentar `AUTH_MODE=mock`.
- [x] 7.2 Verificación: `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm run test`, `npm run test:e2e`, `npm run build`, `openspec validate --all --strict`.
