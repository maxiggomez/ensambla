# Proposal: design-system-radar

## Why

El usuario validó una identidad visual distinta a la del prototipo original
(índigo): el estilo de "Radar Laboral" — tinta verde-oscura sobre papel, acento
lima, Inter con titulares apretados, superficies suaves de radio generoso.
Estamos temprano (4 páginas construidas), es el momento barato para cambiar la
identidad. Además existe un bug real: la fuente nunca se aplica
(`--font-sans: var(--font-sans)` circular en `globals.css`) y la UI renderiza
en serif del navegador.

## What Changes

- **Tokens** (fuente única, ADR-0007): reemplazar la paleta índigo por la Radar
  en `globals.css` (shadcn vars + `@theme`) y en `docs/design-system.md`.
  Los tokens semánticos (ok/warn/risk/info) y sus reglas no cambian.
- **Tipografía**: Inter (next/font) aplicada de verdad; titulares con
  letter-spacing negativo; corrige el bug de fuente.
- **Páginas existentes** (`/`, `/onboarding`, `/members`): aplicar la identidad
  (hero con eyebrow, cards, botón lima, badges verdes) **sin cambiar labels,
  flujos ni semántica** — los e2e de identity-org deben pasar sin ediciones.
- **ADR-0007**: nota de actualización (la referencia visual pasa del prototipo
  índigo al estilo Radar).

## Capabilities

### New: `design-system`

Identidad visual aplicada y verificable: tokens Radar como fuente única y
tipografía Inter efectivamente cargada.

## Impact

- `src/app/` (globals.css, layout, page, onboarding, members) — solo capa UI.
- `docs/design-system.md`, `docs/adr/ADR-0007-sistema-de-diseno.md`.
- Sin impacto en domain/application/infrastructure, DB ni áreas 🔒.
