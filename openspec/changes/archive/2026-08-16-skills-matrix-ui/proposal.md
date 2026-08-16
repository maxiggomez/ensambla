# Proposal: skills-matrix-ui

## Why

`skills-matrix` tiene dominio/aplicación/infra y RLS completos y probados, pero
la ruta `/skills-y-staffing` renderiza el placeholder `UnderConstruction`
(`mvp-release-readiness`: "No matrix, competency, staffing or gap UI").
Además, la seniority de `identity-org` (R4, insumo del staffing) está
implementada sin UI: nadie puede registrarla.

## What Changes

- **UI de Skills y matriz** en `/skills-y-staffing`: catálogo de Skills
  (definir y renombrar), matriz personas × skills con niveles, filtrable por
  Team, y registro de Competency (nivel 0–4) para Dirección y Líder.
- **Seniority por miembro** (Dirección): control en la matriz que cierra el
  hueco de UI de `identity-org` R4 usando `setMemberSeniority`.
- **Staffing**: elegir una necesidad (un Project o un KeyResult) y ver las
  sugerencias ordenadas (nivel → seniority → disponibilidad) con el flag
  "no margin"; registrar un skill requerido en esa necesidad.
- **Gaps**: alertas de cobertura y bus factor derivadas (`evaluateGaps`).

No cambia el backend: solo se consumen los contratos públicos existentes de
`skills-matrix`, `identity-org`, `teams-staffing` y `okrs`.

## Capabilities

### MODIFIED: `skills-matrix`

Nuevos requirements de UI. Se reemplaza el placeholder de `app-shell` para
esta ruta.

### MODIFIED: `identity-org`

ADDED Scenario de UI para el Requirement "Member seniority" (el backend ya
existe; se cierra la superficie de uso).

## Non-goals

- No tocar `src/modules/skills-matrix/**` ni `src/modules/identity-org/**`
  (domain/application/infrastructure).
- No gestión de competencias en masa; una celda a la vez.
- No importar skills ni sugerencias de IA.

## Impact

- `src/app/(app)/skills-y-staffing/` (nueva página + actions + forms +
  parsers + test de contrato UI).
- `e2e/skills-matrix.spec.ts` (nuevo) y `e2e/app-shell.spec.ts` (deja de
  asumir placeholder en esta ruta).
- `playwright.dev-auth.config.ts` (testMatch nuevo). Specs delta de
  `skills-matrix` e `identity-org`.