## Why

El contenedor de página estándar quedó unificado (change `page-padding-consistency`)
y documentado en la spec de `design-system`, pero no hay ningún guard contra
regresiones: una página nueva del shell puede volver a renderizar un `<div>` sin
padding y pegado a la sidebar. Se necesita una regla de lint custom que haga
cumplir el contrato de padding/centrado en toda `page.tsx` del shell, y migrar
las dos páginas que todavía no cumplen el padding estándar (`members` y
`culture-enps`, que usan `p-6` / `p-6 md:p-10` en vez de `px-6 md:px-10` + `py-10`).

## What Changes

- `tools/eslint/page-container.mjs` (nuevo): regla ESLint custom `ensambla/page-container`
  que inspecciona el AST del default export de cada página y exige que el root JSX
  sea `<main>` con `mx-auto`, `w-full`, `px-6 md:px-10` y `py-10`.
- `eslint.config.mjs`: registrar el plugin local y activar la regla como `error`
  en `src/app/(app)/**/page.tsx`.
- `vitest.config.ts`: nuevo proyecto `eslint-rules` que incluye los tests de
  reglas (`tools/eslint/**/*.test.mjs`), con `RuleTester`.
- `src/app/(app)/members/page.tsx` y `src/app/(app)/culture-enps/page.tsx`:
  migran su padding a `px-6 py-10 md:px-10`, manteniendo su `max-width` intencional
  (`max-w-3xl` / `max-w-6xl`) y `min-h-screen`.
- Delta de spec `design-system`: la requirement `Consistent page container` pasa
  a un contrato de padding/centrado (no de ancho) y exige el enforcement por lint.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system`: la requirement `Consistent page container` se redefine como
  contrato de padding (root `<main>`, centrado, `px-6 md:px-10`, `py-10`) sin
  fijar ancho; se agrega un Scenario que exige que el linter marque una página
  que incumpla el contrato.

## Impact

- Cuatro archivos de tooling/config + dos páginas UI + un delta de spec.
  Sin dominio, aplicación, infraestructura ni esquema. Sin áreas 🔒.
  No agrega ni quita requisitos de capability.